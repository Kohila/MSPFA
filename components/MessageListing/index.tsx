import './styles.module.scss';
import IconImage from 'components/IconImage';
import type { ClientMessage } from 'modules/client/messages';
import Link from 'components/Link';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import BBCode, { sanitizeBBCode } from 'components/BBCode';
import { useUserCache } from 'modules/client/UserCache';
import Timestamp from 'components/Timestamp';
import { setUser, useUser } from 'modules/client/users';
import api from 'modules/client/api';
import type { APIClient, APIError } from 'modules/client/api';
import Button from 'components/Button';
import RemoveButton from 'components/Button/RemoveButton';
import { Dialog } from 'modules/client/dialogs';

type MessageReadByAPI = APIClient<typeof import('pages/api/messages/[messageID]/readBy').default>;
type MessageReadByUserAPI = APIClient<typeof import('pages/api/messages/[messageID]/readBy/[userID]').default>;
type MessageDeletedByAPI = APIClient<typeof import('pages/api/messages/[messageID]/deletedBy').default>;

export type MessageListingProps = {
	children: ClientMessage
};

const MessageListing = ({ children: messageProp }: MessageListingProps) => {
	const user = useUser();
	const message = useMemo(() => messageProp, [messageProp]); // TODO: Don't `useMemo`.

	const { userCache } = useUserCache();
	const fromUser = userCache[message.from]!;

	const [open, setOpen] = useState(false);

	const plainContent = useMemo(() => {
		const fullPlainContent = sanitizeBBCode(message.content, { noBB: true });

		const lineBreakIndex = fullPlainContent.indexOf('\n');
		return (
			lineBreakIndex === -1
				? fullPlainContent
				// Slice off everything after the first line.
				: fullPlainContent.slice(0, lineBreakIndex)
		);
	}, [message.content]);
	const [richContent, setRichContent] = useState<string | undefined>(undefined);

	// This state is whether the message's content is rich, or whether it is not completely visible due to overflowing its container.
	const [moreLinkVisible, setMoreLinkVisible] = useState(false);
	const listingRef = useRef<HTMLDivElement>(null!);
	const contentRef = useRef<HTMLDivElement>(null!);

	useLayoutEffect(() => {
		const newRichContent = sanitizeBBCode(message.content);
		setRichContent(newRichContent);

		if (plainContent !== newRichContent) {
			setMoreLinkVisible(true);
		}

		// This ESLint comment is necessary because the rule incorrectly thinks `plainContent` should be a dependency here, despite that it depends on `message.content` which is already a dependency.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [message.content]);

	useLayoutEffect(() => {
		if (
			// Check that this message's rich content has loaded via the previous effect hook.
			richContent !== undefined
			// Check that this message's content is plain text.
			&& plainContent === richContent
		) {
			const onResize = () => {
				if (open) {
					// Temporarily show less so the overflow detection can be accurate.
					listingRef.current.className = listingRef.current.className.replace(/(?:^| )open( |$)/, '$1');
				}

				setMoreLinkVisible(
					// Whether the message's content overflows its container.
					contentRef.current.scrollWidth > contentRef.current.offsetWidth
				);

				if (open) {
					listingRef.current.className += ' open';
				}
			};

			onResize();
			window.addEventListener('resize', onResize);

			return () => {
				window.removeEventListener('resize', onResize);
			};
		}

		// `message.content` should be a dependency here because the widths of `contentRef.current` depend on it and are referenced in this hook.
		// This ESLint comment is necessary because the rule incorrectly thinks `plainContent` should be a dependency here, despite that it depends on `message.content` which is already a dependency.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [richContent, message.content, open]);

	/** Whether the user is a recipient of this message. */
	const userIsRecipient = user && message.to.includes(user.id);

	// This state is whether marking the message as read or unread is currently loading.
	const [markLoading, setMarkLoading] = useState(false);
	// This state is whether deleting the message is currently loading.
	const [deleteLoading, setDeleteLoading] = useState(false);

	const markRead = useCallback(async (
		/** `true` if should mark as read. `false` if should mark as unread. */
		read: boolean
	) => {
		if (markLoading || !userIsRecipient) {
			return;
		}

		setMarkLoading(true);

		const beforeInterceptError = (error: APIError) => {
			if (
				error.response && (
					(read && error.response.data.error === 'ALREADY_EXISTS')
					|| (!read && error.response.status === 404)
				)
			) {
				// The user already has the message marked as read or unread.

				error.preventDefault();

				message.read = read;

				setUser({
					...user!,
					unreadMessageCount: user!.unreadMessageCount + (read ? -1 : 1)
				});
			}
		};

		const { data: { unreadMessageCount } } = await (
			read
				? (api as MessageReadByAPI).post(
					`/messages/${message.id}/readBy`,
					{ userID: user!.id },
					{ beforeInterceptError }
				)
				: (api as MessageReadByUserAPI).delete(
					`/messages/${message.id}/readBy/${user!.id}`,
					{ beforeInterceptError }
				)
		).finally(() => {
			setMarkLoading(false);
		});

		message.read = read;

		setUser({
			...user!,
			unreadMessageCount
		});
	}, [user, userIsRecipient, markLoading, message]);

	const toggleRead = useCallback(() => {
		markRead(!message.read);
	}, [markRead, message.read]);

	const showMore = useCallback(() => {
		setOpen(true);

		if (!message.read) {
			markRead(true);
		}
	}, [message.read, markRead]);

	const showLess = useCallback(() => {
		setOpen(false);
	}, []);

	const deleteMessage = useCallback(async () => {
		if (deleteLoading || !(
			userIsRecipient
			&& await Dialog.confirm({
				id: 'delete-message',
				title: 'Delete Message',
				content: (
					<>
						Are you sure you want to delete this message?<br />
						<br />
						<i>{message.subject}</i><br />
						<br />
						The message will only be deleted for you.
					</>
				)
			})
		)) {
			return;
		}

		setDeleteLoading(true);

		await (api as MessageDeletedByAPI).post(`/messages/${message.id}/deletedBy`, {
			userID: user!.id
		});

		if (message.read) {
			setUser({
				...user!,
				unreadMessageCount: user!.unreadMessageCount - 1
			});
		}
	}, [user, userIsRecipient, deleteLoading, message.id, message.subject, message.read]);

	return (
		<div
			className={`listing${message.read ? ' read' : ''}${open ? ' open' : ''}`}
			ref={listingRef}
		>
			<label className="listing-selected-label" title="Select Message">
				<input type="checkbox" />
			</label>
			<Link
				className="listing-icon"
				href={`/message/${message.id}`}
				title={message.subject}
			>
				<IconImage
					src={fromUser.icon}
					alt={`${fromUser.name}'s Icon`}
				/>
			</Link>
			<div className="listing-info">
				<Link
					className="listing-title translucent-text"
					href={`/message/${message.id}`}
					title={message.subject}
				>
					{message.subject}
				</Link>
				<div className="listing-section listing-meta">
					{'From '}
					<Link href={`/user/${fromUser.id}`}>
						{fromUser.name}
					</Link>
					{' - '}
					<Timestamp
						relative
						edited={message.edited}
					>
						{message.sent}
					</Timestamp>
				</div>
				<div
					className="listing-section listing-content"
					ref={contentRef}
				>
					<BBCode>
						{open ? richContent : plainContent}
					</BBCode>
				</div>
				{moreLinkVisible && (
					<div className="listing-section listing-footer">
						<Link
							className="listing-more-link"
							onClick={open ? showLess : showMore}
						>
							{open ? 'Show Less' : 'Show More'}
						</Link>
					</div>
				)}
			</div>
			{userIsRecipient && (
				<div className="listing-actions">
					<Button
						className={`icon${message.read ? ' mark-unread' : ' mark-read'}`}
						title={message.read ? 'Mark as Unread' : 'Mark as Read'}
						onClick={toggleRead}
					/>
					<RemoveButton
						title="Delete"
						onClick={deleteMessage}
					/>
				</div>
			)}
		</div>
	);
};

MessageListing.listClassName = 'message-list';

export default MessageListing;