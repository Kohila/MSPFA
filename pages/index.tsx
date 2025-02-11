import { MAX_LATEST_PAGES, NEWS_POSTS_PER_REQUEST } from 'components/StoryViewer';
import type { ClientPreviousPageIDs } from 'components/StoryViewer';
import { uniqBy } from 'lodash';
import { withErrorPage } from 'lib/client/errors';
import { Perm } from 'lib/client/perms';
import type { ClientStoryPage, PublicStory, StoryLogListings } from 'lib/client/stories';
import { StoryPrivacy } from 'lib/client/stories';
import { useUserCache } from 'lib/client/UserCache';
import type { PublicUser } from 'lib/client/users';
import { withStatusCode } from 'lib/server/errors';
import type { StoryPageID } from 'lib/server/stories';
import { getPublicStory, getStoryByUnsafeID, getClientPagesAround } from 'lib/server/stories';
import users, { getPublicUser } from 'lib/server/users';
import type { integer } from 'lib/types';
import dynamic from 'next/dynamic';
import type { ClientNews } from 'lib/client/news';
import { getClientNews } from 'lib/server/news';

const Homepage = dynamic(() => import('components/Homepage'));
const StoryViewer = dynamic(() => import('components/StoryViewer'));

type ServerSideProps = {
	userCache?: never,
	story?: never,
	pages?: never,
	previousPageIDs?: never,
	latestPages?: never,
	newsPosts?: never
} | {
	userCache: PublicUser[],
	story: PublicStory,
	pages: Record<StoryPageID, ClientStoryPage | null>,
	previousPageIDs: ClientPreviousPageIDs,
	latestPages: StoryLogListings,
	newsPosts: ClientNews[]
} | {
	statusCode: integer
};

const Component = withErrorPage<ServerSideProps>(({
	userCache: initialUserCache,
	...props
}) => {
	const { cacheUser } = useUserCache();
	initialUserCache?.forEach(cacheUser);

	return (
		props.story
			? (
				<StoryViewer
					// This key is to make the `StoryViewer`'s states not preserve between different stories.
					key={props.story.id}
					{...props}
				/>
			)
			: <Homepage />
	);
});

export default Component;

export const getServerSideProps = withStatusCode<ServerSideProps>(async ({ req, query }) => {
	if (typeof query.s !== 'string') {
		// Load the `Homepage`.

		return { props: {} };
	}

	// Load the `StoryViewer`.

	const story = await getStoryByUnsafeID(query.s);

	if (!story) {
		return { props: { statusCode: 404 } };
	}

	const previewMode = 'preview' in query;

	if ((
		previewMode
		|| story.privacy === StoryPrivacy.Private
	) && !(
		req.user && (
			story.owner.equals(req.user._id)
			|| story.editors.some(userID => userID.equals(req.user!._id))
			|| (req.user.perms & Perm.sudoRead)
		)
	)) {
		return { props: { statusCode: 403 } };
	}

	const pageID = (
		typeof query.p === 'string'
			? +query.p
			: 1
	);

	const { clientPages, clientPreviousPageIDs } = getClientPagesAround(story, pageID, previewMode);

	/** A `StoryLogListings` of pages in the story's "Latest Pages" section. */
	const latestPages: StoryLogListings = [];

	for (
		let latestPageID = (
			previewMode
				? Object.values(story.pages).length
				: story.pageCount
		);
		(
			latestPageID > 0
			&& latestPages.length < MAX_LATEST_PAGES
		);
		latestPageID--
	) {
		const latestPage = story.pages[latestPageID];

		if (!latestPage.unlisted) {
			latestPages.push({
				id: latestPageID,
				...latestPage.published !== undefined && {
					published: +latestPage.published
				},
				title: latestPage.title
			});
		}
	}

	const newsPosts = story.news.slice(0, NEWS_POSTS_PER_REQUEST);

	return {
		props: {
			userCache: await users.find!({
				_id: {
					$in: uniqBy([
						story.owner,
						...story.editors,
						...newsPosts.map(({ author }) => author)
					], String)
				},
				willDelete: { $exists: false }
			}).map(getPublicUser).toArray(),
			story: getPublicStory(story),
			pages: clientPages,
			// The reason this is sent to the client rather than having SSR and the client compute it a second time is as an optimization (and also it's simpler code).
			previousPageIDs: clientPreviousPageIDs,
			latestPages,
			newsPosts: newsPosts.map(getClientNews)
		}
	};
});