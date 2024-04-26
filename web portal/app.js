require('dotenv').config();
const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); // Import child_process module
const app = express();
const UPLOAD_FOLDER = 'uploads';
const cookieParser = require('cookie-parser');
const msal = require('@azure/msal-node');

const msalConfig = {
    auth: {
        clientId: process.env.CLIENT_ID,
        authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
        clientSecret: process.env.CLIENT_SECRET
    }
};

const pca = new msal.ConfidentialClientApplication(msalConfig);


// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER);
}


app.use(express.static(path.join(__dirname, 'static')));
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(fileUpload());


function isAuthenticated(req, res, next) {
    if (req.signedCookies.auth === 'authenticated') {
        return next();
    } else {
        res.status(401).send('Not authorized. Please log in.');
    }
}

app.get('/uploadfile', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'code-form.html'));

});

app.get('/login', (req, res) => {
    if (req.signedCookies.auth === 'authenticated') {
        res.redirect('/uploadfile');
    } else {
        res.sendFile(path.join(__dirname, 'templates', 'login.html'));
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('auth');
    res.redirect('/login');
});

app.get('/',(req, res) => {
    if (req.signedCookies.auth === 'authenticated') {
        res.redirect('/uploadfile');
    } else {
        res.sendFile(path.join(__dirname, 'templates', 'login.html'));
    } 
});

app.post('/login', async (req, res) => { 
    const { email, password } = req.body;
    const authRequest = {
        scopes: ["user.read"],
        username: email,
        password: password
    };

 try {
        const authResult = await pca.acquireTokenByUsernamePassword(authRequest);
        res.cookie('auth', 'authenticated', { httpOnly: true, signed: true }); // Set a signed cookie
        res.redirect('/uploadfile');
    } catch (error) {
        res.send(`Authentication failed: ${error.message}`);
    }
});


app.post('/uploadfile', (req, res) => {
    const { githubRepo, 'prog-language': progLanguage, 'requirements-check': requirementsCheck, 'Dockerfile':Dockerfile } = req.body;
    const dataToSave = {
        githubRepo: githubRepo,
        progLanguage: progLanguage,
        requirementsCheck: requirementsCheck,
        Dockerfile: Dockerfile
    };
    fs.writeFile('output.json', JSON.stringify(dataToSave), (err) => {
        if(err) {
            console.error('Error writing to file', err);
        } else {
            console.log('Data saved successfully');
        }
    });
    // Validate input: Either GitHub URL or file(s) should be provided, but not both
    if (githubRepo && req.files && Object.keys(req.files).length > 0) {
        return res.status(400).send('Please provide either a GitHub repository link or file(s) to upload, not both.');
    }

    // GitHub URL submission
    if (githubRepo) {
        const destinationPath = path.join(UPLOAD_FOLDER, new URL(githubRepo).pathname.split('/').pop());

        // Use exec to clone the repository
        exec(`git clone ${githubRepo} ${destinationPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send(`Failed to clone the repository: ${error.message}`);
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            console.log('Repository cloned successfully')
            return res.send(`Repository cloned successfully. Programming Language: ${progLanguage}. Requirements.txt confirmed: ${requirementsCheck ? 'Yes' : 'No'} . Existant Dockerfile: ${Dockerfile}`);
        });
    } 
    // Folder/File upload
    else if (req.files && Object.keys(req.files).length > 0) {
        const files = req.files.file;
        const processFile = (file) => {
            const filePath = path.join(UPLOAD_FOLDER, file.name.trim());
            if (fs.existsSync(filePath)) {
                return res.status(400).send('File already exists: ' + file.name.trim());
            }
            file.mv(filePath, err => {
                if (err) {
                    console.error('Error:', err);
                    return res.status(500).send('Error uploading file/folder.');
                }
            });
        };
        // Handle single file upload scenario
        if (!Array.isArray(files)) {
            processFile(files);
        } 
        // Handle multiple files upload scenario
        else {
            files.forEach(file => processFile(file));
        }
        return res.send(`Files/Folders uploaded successfully. Programming Language: ${progLanguage}. Requirements.txt confirmed: ${requirementsCheck ? 'Yes' : 'No'}. Existant Dockerfile: ${Dockerfile}`);
    } 
    // No input provided
    else {
        return res.status(400).send('No files were uploaded and no GitHub repository link was provided.');
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
