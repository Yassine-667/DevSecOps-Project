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

app.use(express.static(path.join(__dirname, 'js')));
app.use('/js', express.static(path.join(__dirname, 'js')));
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

app.post('/logout', (req, res) => {
    res.clearCookie('auth');
    const script_directory2=path.join(__dirname, '..', 'scripts', 'cleanup.py');
    function executePythonScript() {
        exec(`py "${script_directory2}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
        });
    }
    executePythonScript();
    res.redirect('/login');
});

app.get('/',(req, res) => {
    if (req.signedCookies.auth === 'authenticated') {
        res.redirect('/uploadfile');
    } else {
        res.sendFile(path.join(__dirname, 'templates', 'login.html'));
    } 
});


app.get('/results',(req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'results.html'));
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
        res.cookie('user_email', email, { signed: true });
        res.redirect('/uploadfile');
    } catch (error) {
        res.send(`Authentication failed: ${error.message}`);
    }
});


app.post('/uploadfile', (req, res) => {
    const { githubRepo, 'prog-language': progLanguage, 'requirements-check': requirementsCheck, 'Dockerfile': Dockerfile } = req.body;
    const dataToSave = {
        githubRepo: githubRepo,
        progLanguage: progLanguage,
        requirementsCheck: requirementsCheck,
        Dockerfile: Dockerfile
    };
    const script_directory=path.join(__dirname, '..', 'scripts', 'main-script.py');
    fs.writeFile('output.json', JSON.stringify(dataToSave), (err) => {
        if (err) {
            console.error('Error writing to file', err);
            return res.status(500).send('Error saving data.');
        } else {
            console.log('Data saved successfully');

            // Continue with further processing after file write
            processUpload();
            setTimeout(() => {
                res.redirect('/results');
            }, 6000);

        }
    });

    function processUpload() {
        if (githubRepo && req.files && Object.keys(req.files).length > 0) {
            return res.status(400).send('Please provide either a GitHub repository link or file(s) to upload, not both.');
        }
    
        if (githubRepo) {
            const destinationPath = path.join(UPLOAD_FOLDER, new URL(githubRepo).pathname.split('/').pop());
    
            exec(`git clone ${githubRepo} ${destinationPath}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return res.status(500).send(`Failed to clone the repository: ${error.message}`);
                }
                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
                console.log('Repository cloned successfully');
    
                executePythonScript(); // Execute Python script here
            });
        } else if (req.files && Object.keys(req.files).length > 0) {
            const files = req.files.file;
            const processFile = (file, callback) => {
                const filePath = path.join(UPLOAD_FOLDER, file.name.trim());
                if (fs.existsSync(filePath)) {
                    return res.status(400).send('File already exists: ' + file.name.trim());
                }
                file.mv(filePath, err => {
                    if (err) {
                        console.error('Error:', err);
                        return res.status(500).send('Error uploading file/folder.');
                    }
                    callback();
                });
            };
    
            const processFiles = () => {
                if (!Array.isArray(files)) {
                    processFile(files, executePythonScript);
                } else {
                    let uploadsCompleted = 0;
                    files.forEach(file => {
                        processFile(file, () => {
                            uploadsCompleted++;
                            if (uploadsCompleted === files.length) {
                                executePythonScript(); // Execute Python script after all files are uploaded
                            }
                        });
                    });
                }
            };

            processFiles();
        } else {
            return res.status(400).send('No files were uploaded and no GitHub repository link was provided.');
        }
    }
    
    function executePythonScript() {
        exec(`py "${script_directory}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send(`Failed to execute Python script: ${error.message}`);
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            res.send('Python script executed successfully.');
        });
    }
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

