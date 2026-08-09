import api from './client';

/**
 * The signed-in account.
 *
 * Both routes resolve the user from the JWT rather than a path id, so there is nothing to pass
 * and no way to ask for somebody else's profile.
 */
export const getMe = () => api.get('/api/users/me');

/** Send only what changes — omitted fields are left alone. Phone is not editable. */
export const updateMe = ({ name, email }) => api.put('/api/users/me', { name, email });
