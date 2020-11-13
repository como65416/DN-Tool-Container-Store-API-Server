const { Container } = require('typedi');
const dateFormat = require('dateformat');
const fs = require('fs');
const path = require('path');
const uniqid = require('uniqid');
const environment = require('../libs/environment');
const sequelize = require('../libs/sequelize');
const { Package: PackageModel } = require('../models');
const packageZipUitl = require('../libs/package-zip');

class Package {
  async getAllPublishedPackages() {
    const packages = await PackageModel.findAll({
      where: {
        status: 'published',
      },
    });

    return packages.map((p) => p.dataValues);
  }

  /**
   * @param  {Integer} packageId
   * @return {Object}
   */
  async getPackageInfo(packageId) {
    const thePackage = await PackageModel.findByPk(packageId);

    return (thePackage != null) ? thePackage.dataValues : thePackage;
  }

  async deletePackage(packageId) {
    const thePackage = await PackageModel.findByPk(packageId);

    // delete icon
    const iconDirPath = environment.getIconFolderPath();
    if (thePackage.icon_filename != null && thePackage.icon_filename !== '' && fs.existsSync(iconDirPath + thePackage.icon_filename)) {
      fs.unlinkSync(iconDirPath + thePackage.icon_filename);
    }

    // delete zip
    const packageDirPath = environment.getPackageFolderPath();
    if (thePackage.package_filename != null && thePackage.package_filename !== '' && fs.existsSync(packageDirPath + thePackage.package_filename)) {
      fs.unlinkSync(packageDirPath + thePackage.package_filename);
    }

    // delete data
    await thePackage.destroy();
  }

  /**
   * @param  {String} username
   * @return {Array}
   */
  async getUserPackages(username) {
    const packages = await PackageModel.findAll({
      where: {
        publish_username: username,
      },
    });

    return packages.map((p) => p.dataValues);
  }

  /**
   * @param  {String}    username
   * @param  {Object}    packageInfo
   * @param  {String}    filePath    package zip file path
   */
  async createPackage(username, packageInfo, filePath) {
    const encoderService = Container.get('encoderService');

    const transaction = await sequelize.transaction();

    try {
      const thePackage = await PackageModel.create({
        name: packageInfo.name,
        description: packageInfo.description,
        version: dateFormat('yyyymmdd.HHMMss'),
        publish_username: username,
        status: 'published',
      }, { transaction });

      // extract icon from package zip
      let iconSaveFilename = `${thePackage.id}-${uniqid()}.jpg`;
      const iconDirPath = environment.getIconFolderPath();
      const iconInfo = await packageZipUitl.extractZipIcon(filePath, `${iconDirPath}/${iconSaveFilename}`);
      if (iconInfo == null) {
        iconSaveFilename = '';
      }
      thePackage.icon_filename = iconSaveFilename;

      // update zip manifest.json config
      await packageZipUitl.updateZipManifestConfig(filePath, {
        packageId: encoderService.encodeId(thePackage.id.toString()),
        description: packageInfo.description,
        packageName: packageInfo.name,
      });

      // copy zip to package dir
      const packageDirPath = environment.getPackageFolderPath();
      const savePackageName = `${thePackage.id}-${uniqid()}.zip`;
      fs.copyFileSync(filePath, packageDirPath + savePackageName);
      thePackage.package_filename = savePackageName;

      // update file information
      await thePackage.save({ transaction });
      await transaction.commit();

      return thePackage.id;
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  /**
   * @param  {Integer} packageId
   * @param  {Object}  packageInfo
   * @param  {String}  filePath    package zip path
   */
  async updatePackage(packageId, packageInfo, filePath) {
    const encoderService = Container.get('encoderService');

    const thePackage = await PackageModel.findByPk(packageId);

    const manifestUpdateDatas = {};
    if (packageInfo.description != null) {
      thePackage.description = packageInfo.description;
      manifestUpdateDatas.description = packageInfo.description;
    }

    if (packageInfo.name != null) {
      thePackage.name = packageInfo.name;
      manifestUpdateDatas.packageName = packageInfo.name;
    }

    const packageDirPath = environment.getPackageFolderPath();
    if (filePath != null) {
      // update version
      const version = dateFormat('yyyymmdd.HHMMss');
      thePackage.version = version;
      manifestUpdateDatas.version = version;
      manifestUpdateDatas.packageId = encoderService.encodeId(packageId);

      // extract icon file from package zip
      const iconDirPath = environment.getIconFolderPath();
      if (thePackage.icon_filename != null && thePackage.icon_filename !== '' && fs.existsSync(iconDirPath + thePackage.icon_filename)) {
        fs.unlinkSync(iconDirPath + thePackage.icon_filename);
      }
      const iconSaveFilename = `${packageId}-${uniqid()}.jpg`;
      const iconInfo = await packageZipUitl.extractZipIcon(filePath, `${iconDirPath}/${iconSaveFilename}`);
      thePackage.icon_filename = (iconInfo != null) ? iconSaveFilename : '';

      // update manifest information (new zip)
      await packageZipUitl.updateZipManifestConfig(filePath, manifestUpdateDatas);
      fs.copyFileSync(filePath, packageDirPath + thePackage.package_filename);
    } else {
      // update manifest information (old zip)
      const originalPath = packageDirPath + thePackage.package_filename;
      await packageZipUitl.updateZipManifestConfig(originalPath, manifestUpdateDatas);
    }

    // update package data
    await thePackage.save();
  }

  /**
   * @param  {Integer}      packageId
   * @return {String|null}  icon path
   */
  async getPackageIconPath(packageId) {
    const thePackage = await PackageModel.findByPk(packageId);

    if (thePackage == null) {
      return null;
    }

    const iconDirPath = environment.getIconFolderPath();
    if (fs.existsSync(iconDirPath + thePackage.icon_filename)) {
      return path.resolve(iconDirPath + thePackage.icon_filename);
    }

    return path.resolve(environment.getDefaultIconPath());
  }

  /**
   * @param  {Integer}      packageId
   * @return {String|null}  package file path
   */
  async getPackageZipPath(packageId) {
    const thePackage = await PackageModel.findByPk(packageId);

    const packageDirPath = environment.getPackageFolderPath();
    if (thePackage != null && fs.existsSync(packageDirPath + thePackage.package_filename)) {
      return path.resolve(packageDirPath + thePackage.package_filename);
    }

    return null;
  }
}

module.exports = Package;
