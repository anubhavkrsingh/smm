'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('fb_posts', 'status', {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: 'SCHEDULED',
    });

    await queryInterface.addColumn('fb_posts', 'scheduled_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('fb_posts', 'status');
    await queryInterface.removeColumn('fb_posts', 'scheduled_at');
  },
};
