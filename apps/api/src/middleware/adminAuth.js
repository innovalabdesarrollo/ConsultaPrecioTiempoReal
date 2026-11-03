export function adminAuth(adminToken) {
	return (req, res, next) => {
		const header = req.get('x-admin-token') || '';
		const query = typeof req.query.token === 'string' ? req.query.token : '';
		const token = header || query;
		if (!adminToken || token !== adminToken) {
			return res.status(401).json({ error: 'No autorizado' });
		}
		next();
	};
}
