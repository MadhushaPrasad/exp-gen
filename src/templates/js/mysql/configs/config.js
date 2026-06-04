const config = {
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "",
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10", 10),
  },
  port: parseInt(process.env.PORT || "3000", 10),
  listPerPage: parseInt(process.env.LIST_PER_PAGE || "50", 10),
};
export default config;
