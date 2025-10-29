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
        allowNull: true,
        validate: { isUrl: true },
      },
      caption: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      facebookAccessToken: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      pageId: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },

      // ✅ NEW
      status: {
        type: DataTypes.STRING(32), // e.g. 'DRAFT' | 'SCHEDULED' | 'POSTED' | 'FAILED'
        allowNull: false,
        defaultValue: 'SCHEDULED',
      },
      scheduledAt: {
        type: DataTypes.DATE,       // store date & time the post is scheduled
        allowNull: true,            // null if not scheduled
      },
    },
    {
      tableName: "fb_posts",
      underscored: true,
      timestamps: true, // created_at, updated_at
      indexes: [
        { fields: ["page_id"] },
        { fields: ["status"] },
        { fields: ["scheduled_at"] },
      ],
    }
  );

  return FbPost;
};
