import api from '../utils/api';

export const getStatistics = async () => {
    return api.get('/api/trip-statistics');
};

export const getAreas = async () => {
    return api.get('/api/get-filters');
};

export const getTripRankings = async (params) => {
    return api.get('/api/trip-rankings-enhanced', { params });
};

export const getTripDetail = async (tripId) => {
    return api.get(`/api/trip-detail?id=${tripId}`);
};

export const searchTrips = async (params) => {
    return api.get('/api/search-trips', { params });
};

export const updateTripStats = async (tripId, action) => {
    return api.post('/api/update-trip-stats', { trip_id: tripId, action });
}; 