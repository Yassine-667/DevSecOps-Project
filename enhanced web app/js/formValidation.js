document.addEventListener("DOMContentLoaded", function() {
    const repoInput = document.getElementById("website");
    const fileInput = document.getElementById("file");
    repoInput.addEventListener("input", function() {
        fileInput.disabled = this.value !== "";
    });
    fileInput.addEventListener("change", function() {
        repoInput.disabled = this.files.length > 0;
    });
    document.getElementById("uploadForm").onsubmit = function(e) {
        if (repoInput.disabled === fileInput.disabled) {
            e.preventDefault();
            alert("Please fill in either the GitHub repository link or select a folder to upload, but not both.");
        }
    };
});