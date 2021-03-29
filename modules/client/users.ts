import type { UserDocument } from 'modules/server/users';
import React, { useContext, useState } from 'react';
import api from 'modules/client/api';
import type { APIClient } from 'modules/client/api';

/** All keys whose values have a serializable type shared by both `DocumentUser` and `PrivateUser`. */
type PrivateUserDocumentKey = 'name' | 'email' | 'verified' | 'description' | 'icon' | 'site' | 'comicSaves' | 'achievements' | 'favs' | 'profileStyle' | 'settings' | 'perms' | 'dev' | 'mod' | 'patron' | 'nameColor';

/** This is a serializable version of `UserDocument` which only has properties that can safely be exposed to the client that owns the user data. */
export type PrivateUser = (
	Pick<UserDocument, PrivateUserDocumentKey>
	& {
		id: string,
		created: number,
		lastSeen: number,
		birthdate: number
	}
);

/** All keys whose values have a serializable type shared by both `DocumentUser` and `PublicUser`. */
type PublicUserDocumentKey = 'name' | 'description' | 'icon' | 'site' | 'achievements' | 'favs' | 'profileStyle' | 'dev' | 'mod' | 'patron' | 'nameColor';

/** This is a serializable version of `UserDocument` which only has properties that can safely be exposed to any client. */
export type PublicUser = (
	Pick<UserDocument, PublicUserDocumentKey>
	& {
		id: string,
		created: number,
		lastSeen: number
	}
);

export const UserContext = React.createContext<PrivateUser | undefined>(undefined);

/**
 * Re-renders the component when the current authenticated user changes (or signs in/out).
 * 
 * Returns the current authenticated user.
 */
export const useUser = () => useContext(UserContext);

let globalUser: undefined | PrivateUser;
let globalSetUserState: undefined | React.Dispatch<React.SetStateAction<PrivateUser | undefined>>;

/** Gets the current authenticated user. */
export const getUser = () => globalUser;

/** Sets the current authenticated user and re-renders all components using it. */
export const setUser = (user: PrivateUser | undefined) => {
	if (globalSetUserState) {
		globalSetUserState(user);
	}
};

export const useUserState = (userProp: PrivateUser | undefined) => {
	const [user, setUserState] = useState(userProp);
	
	globalUser = user;
	globalSetUserState = setUserState;
	
	return user;
};

type SessionAPI = APIClient<typeof import('pages/api/session').default>;

export const signOut = async () => {
	await (api as SessionAPI).delete('session');
	setUser(undefined);
};