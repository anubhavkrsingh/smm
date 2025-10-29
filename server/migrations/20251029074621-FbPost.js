'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('fb_posts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      image_url: {
        type: Sequelize.STRING(2048),
        allowNull: true,
      },
      caption: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      facebook_access_token: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      page_id: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add index for page_id (like in your model)
    await queryInterface.addIndex('fb_posts', ['page_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('fb_posts');
  },
};
