# Fixed Google Apps Script Code for CORS Issues

Copy this ENTIRE code block to your Google Apps Script:

```javascript
// ============================================
// FMS Google Apps Script Web App Backend (CORS Fixed)
// ============================================

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'success',
    message: 'FMS API is running'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    let result;

    switch(action) {
      case 'login':
        result = handleLogin(params);
        break;
      case 'getUsers':
        result = getUsers();
        break;
      case 'createUser':
        result = createUser(params);
        break;
      case 'updateUser':
        result = updateUser(params);
        break;
      case 'deleteUser':
        result = deleteUser(params);
        break;
      case 'createFMS':
        result = createFMS(params);
        break;
      case 'getAllFMS':
        result = getAllFMS();
        break;
      case 'getFMSById':
        result = getFMSById(params.fmsId);
        break;
      case 'createProject':
        result = createProject(params);
        break;
      case 'getAllProjects':
        result = getAllProjects();
        break;
      case 'getProjectsByUser':
        result = getProjectsByUser(params.username);
        break;
      case 'updateTaskStatus':
        result = updateTaskStatus(params);
        break;
      case 'getAllLogs':
        result = getAllLogs();
        break;
      default:
        result = { success: false, message: 'Invalid action' };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleLogin(params) {
  const username = (params.username || '').toString();
  const password = (params.password || '').toString();

  if (!username || !password) {
    return { success: false, message: 'Missing username or password' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    return { success: false, message: 'Users sheet not found' };
  }

  const data = usersSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: false, message: 'No users configured' };
  }

  // Columns: Username(0), Password(1), Name(2), Role(3), Department(4), Last_Login(5)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowUsername = String(row[0]);
    const rowPassword = String(row[1]);

    if (rowUsername === username) {
      if (rowPassword === password) {
        const name = row[2] || '';
        const role = row[3] || '';
        const department = row[4] || '';
        const timestamp = new Date().toISOString();

        // Update Last_Login column (column index 6 in sheet, since sheets are 1-based)
        usersSheet.getRange(i + 1, 6).setValue(timestamp);

        return {
          success: true,
          user: {
            username: username,
            name: name,
            role: role,
            department: department,
            lastLogin: timestamp
          }
        };
      } else {
        return { success: false, message: 'Invalid credentials' };
      }
    }
  }

  return { success: false, message: 'User not found' };
}

function getUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    return { success: false, message: 'Users sheet not found' };
  }

  const data = usersSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: true, users: [] };
  }

  const users = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    users.push({
      username: row[0],
      name: row[2],
      role: row[3],
      department: row[4],
      lastLogin: row[5] || ''
    });
  }

  return { success: true, users: users };
}

function createUser(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    return { success: false, message: 'Users sheet not found' };
  }

  const username = params.username;
  const password = params.password;
  const name = params.name;
  const role = params.role || 'user';
  const department = params.department;

  if (!username || !password || !name || !department) {
    return { success: false, message: 'Missing required fields' };
  }

  // Check if username already exists
  const data = usersSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      return { success: false, message: 'Username already exists' };
    }
  }

  // Add new user
  usersSheet.appendRow([username, password, name, role, department, '']);

  return { success: true, message: 'User created successfully' };
}

function updateUser(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    return { success: false, message: 'Users sheet not found' };
  }

  const id = params.id;
  const updates = { ...params };
  delete updates.id;

  const data = usersSheet.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === id || i.toString() === id.toString()) {
      // Update fields
      if (updates.username) usersSheet.getRange(i + 1, 1).setValue(updates.username);
      if (updates.password) usersSheet.getRange(i + 1, 2).setValue(updates.password);
      if (updates.name) usersSheet.getRange(i + 1, 3).setValue(updates.name);
      if (updates.role) usersSheet.getRange(i + 1, 4).setValue(updates.role);
      if (updates.department) usersSheet.getRange(i + 1, 5).setValue(updates.department);
      found = true;
      break;
    }
  }

  if (!found) {
    return { success: false, message: 'User not found' };
  }

  return { success: true, message: 'User updated successfully' };
}

function deleteUser(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) {
    return { success: false, message: 'Users sheet not found' };
  }

  const id = params.id;
  const data = usersSheet.getDataRange().getValues();
  let found = false;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === id || i.toString() === id.toString()) {
      usersSheet.deleteRow(i + 1);
      found = true;
      break;
    }
  }

  if (!found) {
    return { success: false, message: 'User not found' };
  }

  return { success: true, message: 'User deleted successfully' };
}

function createFMS(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('FMS_MASTER');

  const fmsId = 'FMS' + Date.now();
  const fmsName = params.fmsName;
  const steps = params.steps;
  const username = params.username;
  const timestamp = new Date().toISOString();

  steps.forEach((step, index) => {
    masterSheet.appendRow([
      fmsId,
      fmsName,
      index + 1,
      step.what,
      step.who,
      step.how,
      step.when,
      username,
      timestamp,
      username,
      timestamp
    ]);
  });

  return {
    success: true,
    fmsId: fmsId,
    message: 'FMS created successfully'
  };
}

function getAllFMS() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('FMS_MASTER');
  const data = masterSheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { success: true, fmsList: [] };
  }

  const fmsMap = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const fmsId = row[0];
    const fmsName = row[1];
    const stepNo = row[2];

    if (!fmsMap[fmsId]) {
      fmsMap[fmsId] = {
        fmsId: fmsId,
        fmsName: fmsName,
        stepCount: 0,
        createdBy: row[7],
        createdOn: row[8]
      };
    }

    fmsMap[fmsId].stepCount = Math.max(fmsMap[fmsId].stepCount, stepNo);
  }

  return {
    success: true,
    fmsList: Object.values(fmsMap)
  };
}

function getFMSById(fmsId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('FMS_MASTER');
  const data = masterSheet.getDataRange().getValues();

  const steps = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === fmsId) {
      steps.push({
        stepNo: row[2],
        what: row[3],
        who: row[4],
        how: row[5],
        when: row[6]
      });
    }
  }

  steps.sort((a, b) => a.stepNo - b.stepNo);

  return {
    success: true,
    steps: steps,
    fmsName: steps.length > 0 ? data.find(row => row[0] === fmsId)[1] : ''
  };
}

function createProject(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const progressSheet = ss.getSheetByName('FMS_PROGRESS');
  const masterSheet = ss.getSheetByName('FMS_MASTER');

  const projectId = 'PRJ' + Date.now();
  const fmsId = params.fmsId;
  const projectName = params.projectName;
  const projectStartDate = new Date(params.projectStartDate);
  const username = params.username;
  const timestamp = new Date().toISOString();

  // Get all steps from FMS_MASTER
  const masterData = masterSheet.getDataRange().getValues();
  const steps = [];

  for (let i = 1; i < masterData.length; i++) {
    const row = masterData[i];
    if (row[0] === fmsId) {
      steps.push({
        stepNo: row[2],
        what: row[3],
        who: row[4],
        how: row[5],
        when: row[6]
      });
    }
  }

  steps.sort((a, b) => a.stepNo - b.stepNo);

  // Calculate due date for first step only
  let currentDate = new Date(projectStartDate);
  currentDate.setDate(currentDate.getDate() + parseInt(steps[0].when));

  // Create first step in FMS_PROGRESS
  progressSheet.appendRow([
    projectId,
    fmsId,
    projectName,
    steps[0].stepNo,
    steps[0].what,
    steps[0].who,
    steps[0].how,
    currentDate.toISOString(),
    '',
    'Pending',
    username,
    timestamp,
    username,
    timestamp
  ]);

  return {
    success: true,
    projectId: projectId,
    message: 'Project created successfully'
  };
}

function getAllProjects() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const progressSheet = ss.getSheetByName('FMS_PROGRESS');
  const data = progressSheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { success: true, projects: [] };
  }

  const projectMap = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const projectId = row[0];
    const projectName = row[2];

    if (!projectMap[projectId]) {
      projectMap[projectId] = {
        projectId: projectId,
        fmsId: row[1],
        projectName: projectName,
        tasks: []
      };
    }

    projectMap[projectId].tasks.push({
      stepNo: row[3],
      what: row[4],
      who: row[5],
      how: row[6],
      plannedDueDate: row[7],
      actualCompletedOn: row[8],
      status: row[9]
    });
  }

  return {
    success: true,
    projects: Object.values(projectMap)
  };
}

function getProjectsByUser(username) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const progressSheet = ss.getSheetByName('FMS_PROGRESS');
  const data = progressSheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { success: true, tasks: [] };
  }

  const tasks = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[5] === username) {
      tasks.push({
        rowIndex: i + 1,
        projectId: row[0],
        projectName: row[2],
        stepNo: row[3],
        what: row[4],
        who: row[5],
        how: row[6],
        plannedDueDate: row[7],
        actualCompletedOn: row[8],
        status: row[9]
      });
    }
  }

  return {
    success: true,
    tasks: tasks
  };
}

function updateTaskStatus(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const progressSheet = ss.getSheetByName('FMS_PROGRESS');
  const masterSheet = ss.getSheetByName('FMS_MASTER');

  const rowIndex = params.rowIndex;
  const status = params.status;
  const username = params.username;
  const timestamp = new Date().toISOString();

  // Update current task
  progressSheet.getRange(rowIndex, 9).setValue(status === 'Done' ? timestamp : '');
  progressSheet.getRange(rowIndex, 10).setValue(status);
  progressSheet.getRange(rowIndex, 13).setValue(username);
  progressSheet.getRange(rowIndex, 14).setValue(timestamp);

  // If status is 'Done', create next step
  if (status === 'Done') {
    const currentRow = progressSheet.getRange(rowIndex, 1, 1, 14).getValues()[0];
    const projectId = currentRow[0];
    const fmsId = currentRow[1];
    const projectName = currentRow[2];
    const currentStepNo = currentRow[3];

    // Get all steps from FMS_MASTER for this FMS
    const masterData = masterSheet.getDataRange().getValues();
    const allSteps = [];

    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      if (row[0] === fmsId) {
        allSteps.push({
          stepNo: row[2],
          what: row[3],
          who: row[4],
          how: row[5],
          when: row[6]
        });
      }
    }

    allSteps.sort((a, b) => a.stepNo - b.stepNo);

    // Find next step
    const nextStep = allSteps.find(s => s.stepNo === currentStepNo + 1);

    if (nextStep) {
      // Calculate due date based on current completion date
      const completionDate = new Date(timestamp);
      completionDate.setDate(completionDate.getDate() + parseInt(nextStep.when));

      // Create next step
      progressSheet.appendRow([
        projectId,
        fmsId,
        projectName,
        nextStep.stepNo,
        nextStep.what,
        nextStep.who,
        nextStep.how,
        completionDate.toISOString(),
        '',
        'Pending',
        username,
        timestamp,
        username,
        timestamp
      ]);
    }
  }

  return {
    success: true,
    message: 'Task updated successfully'
  };
}

function getAllLogs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('FMS_MASTER');
  const progressSheet = ss.getSheetByName('FMS_PROGRESS');

  const logs = [];

  // Get FMS creation logs
  const masterData = masterSheet.getDataRange().getValues();
  const fmsCreations = {};

  for (let i = 1; i < masterData.length; i++) {
    const row = masterData[i];
    const fmsId = row[0];
    if (!fmsCreations[fmsId]) {
      fmsCreations[fmsId] = {
        type: 'FMS_CREATED',
        fmsId: fmsId,
        fmsName: row[1],
        createdBy: row[7],
        createdOn: row[8]
      };
    }
  }

  logs.push(...Object.values(fmsCreations));

  // Get project creation logs
  const progressData = progressSheet.getDataRange().getValues();
  const projectCreations = {};

  for (let i = 1; i < progressData.length; i++) {
    const row = progressData[i];
    const projectId = row[0];
    if (!projectCreations[projectId]) {
      projectCreations[projectId] = {
        type: 'PROJECT_CREATED',
        projectId: projectId,
        projectName: row[2],
        createdBy: row[10],
        createdOn: row[11]
      };
    }

    // Task updates
    if (row[12] !== row[10]) {
      logs.push({
        type: 'TASK_UPDATED',
        projectId: projectId,
        projectName: row[2],
        stepNo: row[3],
        what: row[4],
        status: row[9],
        updatedBy: row[12],
        updatedOn: row[13]
      });
    }
  }

  logs.push(...Object.values(projectCreations));

  // Sort by date
  logs.sort((a, b) => {
    const dateA = new Date(a.createdOn || a.updatedOn);
    const dateB = new Date(b.createdOn || b.updatedOn);
    return dateB - dateA;
  });

  return {
    success: true,
    logs: logs
  };
}
```
