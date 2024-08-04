import express from "express";
import { createServer } from "node:http";
import path from "path";
import { Sequelize, DataTypes } from "sequelize";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const publicPath = "dist";
const sequelize = new Sequelize("database", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  // SQLite only
  storage: "database.sqlite",
});

const catalog_assets = sequelize.define("catalog_assets", {
  package_name: {
    type: DataTypes.TEXT,
    unique: true,
  },
  title: {
    type: DataTypes.TEXT,
  },
  description: {
    type: DataTypes.TEXT,
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  version: {
    type: DataTypes.TEXT,
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  video: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  payload: {
    type: DataTypes.TEXT,
  },
  type: {
    type: DataTypes.TEXT,
  },
});

app.use(express.static(publicPath));

app.get("/api", function (request, reply) {
  reply.send({ hello: "world" });
});

// This API returns a list of the assets in the database (SW plugins and themes).
// It can take a `?page=x` argument to display a different page, with a limit of 20 assets per page.
app.get("/api/catalog-assets", async (request, reply) => {
  try {
    const page = parseInt(request.query.page, 10) || 1; // default to page 1

    if (page < 1) {
      reply.status(400).send({ error: "Page must be a positive number!" });
      return;
    }

    const offset = (page - 1) * 20;

    const db_assets = await catalog_assets.findAll({
      offset: offset,
      limit: 20,
    });

    const assets = db_assets.reduce((acc, asset) => {
      acc[asset.package_name] = {
        title: asset.title,
        description: asset.description,
        tags: asset.tags,
        version: asset.version,
        image: asset.image,
        video: asset.video,
        payload: asset.payload,
        type: asset.type,
      };
      return acc;
    }, {});

    reply.send({ assets });
  } catch (error) {
    reply.status(500).send({ error: "There was an error" });
  }
});

// This API returns the total number of pages in the database.
app.get("/api/catalog-pages", async (request, reply) => {
  try {
    const totalItems = await catalog_assets.count();

    reply.send({ pages: Math.ceil(totalItems / 20) });
  } catch (error) {
    reply.status(500).send({ error: "There was an error" });
  }
});

// await catalog_assets.create({
//   package_name: "trolled.fortnite.jpeg",
//   title: "fortnite.jpeg",
//   version: "6.9.420",
//   description: "a man in a blessings shirt sticking his tounge out",
//   tags: ["Fortnite", "Shit out my ass"],
//   payload: "the DAMN CSS",
//   type: "theme",
// });

catalog_assets.sync();
const server = createServer();
server.on("request", (req, res) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  app(req, res);
});
server.listen({
  port: 8080,
});