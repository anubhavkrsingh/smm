// models/FbPost.js
module.exports = (sequelize, DataTypes) => {
  const FbPost = sequelize.define(
    "FbPost",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      imageUrl: {
        type: DataTypes.STRING(2048),
        allowNull: true,          // allow null if text-only post
        validate: { isUrl: true },
      },
      caption: {
        type: DataTypes.TEXT,     // captions can be long
        allowNull: true,
      },
      facebookAccessToken: {
        type: DataTypes.TEXT,     // tokens can be long; consider encrypting at rest
        allowNull: false,
      },
      pageId: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
    },
    {
      tableName: "fb_posts",
      underscored: true,
      timestamps: true,          // adds created_at, updated_at
      indexes: [
        { fields: ["page_id"] },
      ],
    }
  );

  return FbPost;
};
