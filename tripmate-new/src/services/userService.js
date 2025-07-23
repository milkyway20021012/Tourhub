import api from '../utils/api';

export const getUserFavorites = async (userId) => {
    return api.get('/api/user-favorites', { params: { line_user_id: userId }, timeout: 10000 });
};

export const addFavorite = async (userId, tripId) => {
    return api.post('/api/user-favorites', { line_user_id: userId, trip_id: tripId }, { timeout: 10000 });
};

export const removeFavorite = async (userId, tripId) => {
    return api.delete('/api/user-favorites', { data: { line_user_id: userId, trip_id: tripId }, timeout: 10000 });
}; 