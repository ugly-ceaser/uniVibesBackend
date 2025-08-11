export const parsePagination = (query: Record<string, any>, defaults = { limit: 20, page: 1 }) => {
  const limit = Math.min(Math.max(parseInt(query.limit as string) || defaults.limit, 1), 100);
  const page = Math.max(parseInt(query.page as string) || defaults.page, 1);
  const offset = (page - 1) * limit;
  return { limit, page, offset };
}; 