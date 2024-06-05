import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CapacitorSQLite } from '@capacitor-community/sqlite';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SqliteService {
  public dbReady: BehaviorSubject<boolean>;
  public isWeb: boolean;
  public isIOS: boolean;
  public dbName: string;

  constructor(private http: HttpClient) {
    this.dbReady = new BehaviorSubject(false);
    this.isWeb = false;
    this.isIOS = false;
    this.dbName = 'sqgs.db';
  }

  async init() {
    debugger
    const info = await Device.getInfo();
    const sqlite = CapacitorSQLite as any;

    if (info.platform === 'android') {
      try {
        await sqlite.requestPermissions();
      } catch (error) {
        console.error("This app needs permissions to function properly.");
      }
    } else if (info.platform === 'web') {
      this.isWeb = true;
      await sqlite.initWebStore();
    } else if (info.platform === 'ios') {
      this.isIOS = true;
    }

    await this.setupDatabase();
  }

  async setupDatabase() {
    const dbSetup = await Preferences.get({ key: 'first_setup_key' });
    const dbNamePref = await Preferences.get({ key: 'dbname' });

    if (dbNamePref.value) {
      this.dbName = dbNamePref.value;
    }

    console.log("Database name retrieved from preferences:", this.dbName);

    if (!dbSetup.value) {
      await this.createTables();
      await Preferences.set({ key: 'first_setup_key', value: '1' });
      await Preferences.set({ key: 'dbname', value: this.dbName });
      this.dbReady.next(true);
    } else {
      if (!this.dbName) {
        console.error("Database name is not set");
        return;
      }

      console.log("Opening connection to database:", this.dbName);

      try {
        await CapacitorSQLite.createConnection({ database: this.dbName });
        await CapacitorSQLite.open({ database: this.dbName });
        this.dbReady.next(true);
      } catch (error) {
        console.error("Error creating or opening database connection", error);
      }
    }
  }

  async createTables() {
    const tableQueries = {
      Settings: `CREATE TABLE IF NOT EXISTS Settings (
        key_name VARCHAR(45) PRIMARY KEY, 
        key_value VARCHAR(600)
      )`,
      UpdatedTables: `CREATE TABLE IF NOT EXISTS UpdatedTables (
        name VARCHAR(60) PRIMARY KEY, 
        last_modified_date DATETIME
      )`,
      Plants: `CREATE TABLE IF NOT EXISTS Plants (
        id INT PRIMARY KEY, 
        plant_name VARCHAR(100) NOT NULL
      )`,
      Cells: `CREATE TABLE IF NOT EXISTS Cells (
        id INT PRIMARY KEY, 
        description VARCHAR(300) NOT NULL, 
        plants INT NOT NULL, 
        FOREIGN KEY(plants) REFERENCES Plants(id)
      )`,
      Stations: `CREATE TABLE IF NOT EXISTS Stations (
        id INT PRIMARY KEY, 
        description VARCHAR(300) NOT NULL, 
        cells INT NOT NULL, 
        is_sick BOOLEAN, 
        is_approve BOOLEAN, 
        printer VARCHAR(300), 
        sap_identifier VARCHAR(30), 
        station_approver BOOLEAN, 
        sick_consider BOOLEAN, 
        DSN_consider BOOLEAN, 
        FOREIGN KEY(cells) REFERENCES Cells(id)
      )`,
      Shifts: `CREATE TABLE IF NOT EXISTS Shifts (
        id INT PRIMARY KEY, 
        description VARCHAR(300) NOT NULL, 
        plants INT NOT NULL, 
        FOREIGN KEY(plants) REFERENCES Plants(id)
      )`,
      Roles: `CREATE TABLE IF NOT EXISTS Roles (
        id INT PRIMARY KEY, 
        description VARCHAR(100) NOT NULL
      )`,
      SkillLevel: `CREATE TABLE IF NOT EXISTS SkillLevel (
        id INT PRIMARY KEY, 
        description VARCHAR(60) NOT NULL
      )`,
      Users: `CREATE TABLE IF NOT EXISTS Users (
        id INT PRIMARY KEY, 
        plants INT NOT NULL, 
        user_code VARCHAR(50) UNIQUE NOT NULL, 
        name VARCHAR(100) NOT NULL, 
        roles INT NOT NULL, 
        is_active BOOLEAN NOT NULL, 
        is_loggedin BOOLEAN NOT NULL, 
        FOREIGN KEY(plants) REFERENCES Plants(id), 
        FOREIGN KEY(roles) REFERENCES Roles(id)
      )`,
      Stages: `CREATE TABLE IF NOT EXISTS Stages (
        id INT PRIMARY KEY, 
        description VARCHAR(300) NOT NULL, 
        stations TEXT NOT NULL, 
        users TEXT NOT NULL
      )`,
      StageUser: `CREATE TABLE IF NOT EXISTS StageUser (
        id INT PRIMARY KEY, 
        stages INT NOT NULL, 
        users INT NOT NULL, 
        shift INT NOT NULL, 
        skill_level INT NOT NULL, 
        FOREIGN KEY(stages) REFERENCES Stages(id), 
        FOREIGN KEY(users) REFERENCES Users(id), 
        FOREIGN KEY(shift) REFERENCES Shifts(id), 
        FOREIGN KEY(skill_level) REFERENCES SkillLevel(id)
      )`,
      UserDeployment: `CREATE TABLE IF NOT EXISTS UserDeployment (
        id VARCHAR(50) PRIMARY KEY, 
        user_log INT NOT NULL, 
        stage INT NOT NULL, 
        users TEXT NOT NULL, 
        is_updated BOOLEAN, 
        FOREIGN KEY(stage) REFERENCES Stages(id)
      )`,
      InspectionTypes: `CREATE TABLE IF NOT EXISTS InspectionTypes (
        id INT PRIMARY KEY, 
        description VARCHAR(300) NOT NULL
      )`,
      DefectCategories: `CREATE TABLE IF NOT EXISTS DefectCategories (
        id INT PRIMARY KEY, 
        description VARCHAR(60) NOT NULL
      )`,
      SourceGates: `CREATE TABLE IF NOT EXISTS SourceGates (
        id INT PRIMARY KEY, 
        description VARCHAR(60) NOT NULL
      )`,
      Repairs: `CREATE TABLE IF NOT EXISTS Repairs (
        id INT PRIMARY KEY, 
        description VARCHAR(300) NOT NULL, 
        checklist TEXT
      )`,
      Defects: `CREATE TABLE IF NOT EXISTS Defects (
        id INT PRIMARY KEY, 
        description VARCHAR(300) NOT NULL, 
        defectcategories INT NOT NULL, 
        sourcegates INT NOT NULL, 
        repairs TEXT NOT NULL, 
        FOREIGN KEY(defectcategories) REFERENCES DefectCategories(id), 
        FOREIGN KEY(sourcegates) REFERENCES SourceGates(id)
      )`,
      Parts: `CREATE TABLE IF NOT EXISTS Parts (
        id INT PRIMARY KEY, 
        description VARCHAR(45) NOT NULL, 
        defects TEXT NOT NULL, 
        is_active BOOLEAN NOT NULL, 
        image TEXT, 
        stages INT NOT NULL
      )`,
      Images: `CREATE TABLE IF NOT EXISTS Images (
        id INT PRIMARY KEY, 
        description VARCHAR(250) NOT NULL, 
        image_path TEXT NOT NULL, 
        parts TEXT
      )`,
      Checkpoints: `CREATE TABLE IF NOT EXISTS Checkpoints (
        id INT PRIMARY KEY, 
        description VARCHAR(250) NOT NULL, 
        inspectiontypes INT NOT NULL, 
        modelstations INT NOT NULL, 
        parts INT NOT NULL, 
        defects INT NOT NULL, 
        is_new BOOLEAN NOT NULL, 
        checkpoint_order INT NOT NULL, 
        is_active BOOLEAN NOT NULL, 
        FOREIGN KEY(inspectiontypes) REFERENCES InspectionTypes(id), 
        FOREIGN KEY(modelstations) REFERENCES ModelStations(id), 
        FOREIGN KEY(parts) REFERENCES Parts(id), 
        FOREIGN KEY(defects) REFERENCES Defects(id)
      )`,
      Models: `CREATE TABLE IF NOT EXISTS Models (
        id INT PRIMARY KEY, 
        sales_code VARCHAR(100) NOT NULL, 
        description VARCHAR(300) NOT NULL, 
        parts TEXT NOT NULL, 
        is_active BOOLEAN
      )`,
      ModelStations: `CREATE TABLE IF NOT EXISTS ModelStations (
        id INT PRIMARY KEY, 
        model INT NOT NULL, 
        station INT NOT NULL, 
        station_order INT NOT NULL, 
        station_group INT NOT NULL, 
        is_rolldown BOOLEAN NOT NULL, 
        is_final BOOLEAN NOT NULL, 
        d2_rolldown BOOLEAN NOT NULL, 
        is_approval BOOLEAN, 
        FOREIGN KEY(model) REFERENCES Models(id), 
        FOREIGN KEY(station) REFERENCES Stations(id)
      )`,
      SickAggregate: `CREATE TABLE IF NOT EXISTS SickAggregate (
        id INT PRIMARY KEY, 
        name VARCHAR(100) NOT NULL, 
        plant INT NOT NULL, 
        FOREIGN KEY(plant) REFERENCES Plants(id)
      )`,
      SickCheckpoints: `CREATE TABLE IF NOT EXISTS SickCheckpoints (
        id INT PRIMARY KEY, 
        description VARCHAR(250) NOT NULL, 
        sickaggregate INT NOT NULL, 
        parts INT NOT NULL, 
        defects INT NOT NULL, 
        responsibility INT NOT NULL, 
        FOREIGN KEY(sickaggregate) REFERENCES SickAggregate(id), 
        FOREIGN KEY(parts) REFERENCES Parts(id), 
        FOREIGN KEY(defects) REFERENCES Defects(id), 
        FOREIGN KEY(responsibility) REFERENCES Roles(id)
      )`,
      DefectDetails: `CREATE TABLE IF NOT EXISTS DefectDetails (
        id VARCHAR(100) PRIMARY KEY, 
        defect INT NOT NULL, 
        stations INT NOT NULL, 
        users INT NOT NULL, 
        defect_type INT NOT NULL, 
        responsibility INT NOT NULL, 
        additional TEXT NOT NULL, 
        create_date DATETIME NOT NULL, 
        closed_date DATETIME, 
        is_closed BOOLEAN, 
        repairs TEXT NOT NULL, 
        is_dsu BOOLEAN, 
        FOREIGN KEY(defect) REFERENCES Defects(id), 
        FOREIGN KEY(stations) REFERENCES Stations(id), 
        FOREIGN KEY(users) REFERENCES Users(id), 
        FOREIGN KEY(defect_type) REFERENCES InspectionTypes(id), 
        FOREIGN KEY(responsibility) REFERENCES Roles(id)
      )`
    };

    

    for (const [tableName, createQuery] of Object.entries(tableQueries)) {
      try {
        await CapacitorSQLite.execute({
          database: this.dbName,
           statements: createQuery });
           console.log("executed")
      } catch (error) {
        console.error(`Error creating table ${tableName}`, error);
      }
    }

    this.dbReady.next(true);
  }

  async getDbName(): Promise<string> {
    const { value } = await Preferences.get({ key: 'dbname' });
    return value || 'sqgs.db';
  }

  async closeConnection() {
    await CapacitorSQLite.closeConnection({ database: this.dbName });
  }
}