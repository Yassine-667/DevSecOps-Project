const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const download = require('download-git-repo'); // Ensure this package is installed
const { exec } = require('child_process'); // Import child_process module
const app = express();
const UPLOAD_FOLDER = 'uploads';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_FOLDER)) {
    fs.mkdirSync(UPLOAD_FOLDER);
}

app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.post('/upload', (req, res) => {
    const { githubRepo, 'prog-language': progLanguage, 'requirements-check': requirementsCheck } = req.body;

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
            return res.send(`Repository cloned successfully. Programming Language: ${progLanguage}. Requirements.txt confirmed: ${requirementsCheck ? 'Yes' : 'No'}.`);
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
        return res.send(`Files/Folders uploaded successfully. Programming Language: ${progLanguage}. Requirements.txt confirmed: ${requirementsCheck ? 'Yes' : 'No'}.`);
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
