import type { ServerUser } from 'lib/server/users';
import React, { useContext, useState } from 'react';
import api from 'lib/client/api';
import type { APIClient } from 'lib/client/api';
import { startLoading, stopLoading } from 'components/LoadingIndicator';
import Dialog from 'lib/client/Dialog';
import createGlobalState from 'global-react-state';
import type { DateNumber, RecursivePartial } from 'lib/types';

/** All keys whose values have the same serializable type in both `ServerUser` and `PrivateUser`. */
type PrivateServerUserKey = 'email' | 'unverifiedEmail' | 'name' | 'birthdateChanged' | 'description' | 'icon' | 'site' | 'storySaves' | 'achievements' | 'favs' | 'profileStyle' | 'settings' | 'perms' | 'dev' | 'mod' | 'patron' | 'unreadMessageCount';

/** A serializable version of `ServerUser` with only the properties that can safely be exposed to the client that owns the user data. */
export type PrivateUser = (
	Pick<ServerUser, PrivateServerUserKey>
	& {
		id: string,
		created: DateNumber,
		lastSeen: DateNumber,
		birthdate: DateNumber
	}
);

/** All keys whose values have the same serializable type in both `ServerUser` and `PublicUser`. */
type PublicServerUserKey = 'name' | 'description' | 'icon' | 'site' | 'achievements' | 'profileStyle' | 'dev' | 'mod' | 'patron';

/** A serializable version of `ServerUser` with only the properties that can safely be exposed to any client. */
export type PublicUser = (
	Pick<ServerUser, PublicServerUserKey>
	& {
		id: string,
		email?: ServerUser['email'],
		created: DateNumber,
		lastSeen: DateNumber,
		birthdate?: DateNumber,
		favs?: ServerUser['favs']
	}
);

export const defaultSettings: PrivateUser['settings'] = {
	emailPublic: false,
	birthdatePublic: false,
	favsPublic: true,
	autoOpenSpoilers: false,
	stickyNav: false,
	imageAliasing: false,
	theme: 'standard',
	style: '',
	controls: {
		previousPage: 'ArrowLeft',
		nextPage: 'ArrowRight',
		toggleSpoilers: 'Space'
	},
	notifications: {
		messages: { email: true, site: true },
		userTags: { email: true, site: true },
		commentReplies: { email: true, site: true },
		storyDefaults: {
			updates: { email: true, site: true },
			news: { email: true, site: true },
			comments: { email: true, site: true }
		},
		stories: {} as Record<never, never>
	}
} as const;

export const UserContext = React.createContext<PrivateUser | undefined>(undefined);
// Using a React context is necessary here so the user data can be used server-side.

/**
 * Re-renders the component when the current authenticated user changes (or signs in/out).
 *
 * Returns the current authenticated user.
 *
 * ⚠️ Avoid using this for client-only purposes if the component does not need to be updated when the user state changes. Use `getUser` instead.
 */
export const useUser = () => useContext(UserContext);

let globalUserState: PrivateUser | undefined;
let globalSetUserState: React.Dispatch<React.SetStateAction<PrivateUser | undefined>> | undefined;

/**
 * Gets the current authenticated user.
 *
 * ⚠️ Calling this server-side leads to race conditions for which user is currently set in the global state. Unless this is being called in client-only code, use `useUser` instead.
 */
export const getUser = () => globalUserState;

/** Sets the current authenticated user and re-renders all components using it. */
export const setUser = (user: PrivateUser | undefined) => {
	if (globalSetUserState) {
		globalSetUserState(user);
	}
};

/**
 * Similar to `useUser` but without the React context middleman and allows passing the initial user state.
 *
 * ⚠️ This should only be used in `pages/_app`. Please use `useUser` instead because it allows for server-side rendering via React context, and it allows for user modifications passed into the context's value from `pages/_app`.
 */
export const useUserInApp = (initialUserState: PrivateUser | undefined) => {
	[globalUserState, globalSetUserState] = useState(initialUserState);

	return globalUserState;
};

export const [useUserMerge, setUserMerge, getUserMerge] = createGlobalState<RecursivePartial<PrivateUser | undefined>>(undefined);

/** Opens a dialog prompting the user to sign in or sign up. */
export const promptSignIn = async () => {
	startLoading();
	const { openSignInDialog } = await import('lib/client/signIn');
	stopLoading();
	openSignInDialog();
};

type SessionAPI = APIClient<typeof import('pages/api/session').default>;

/** Opens a dialog prompting the user to sign out. */
export const promptSignOut = async () => {
	if (await Dialog.confirm({
		id: 'sign-out',
		title: 'Sign Out',
		content: 'Are you sure you want to sign out?'
	})) {
		await (api as SessionAPI).delete('session');
		setUser(undefined);
	}
};