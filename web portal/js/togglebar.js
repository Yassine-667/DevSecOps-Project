
function toggleSidebar() {
    var sidebar = document.getElementById("sidebar");
    var toggleBtn = document.getElementById("toggle-btn");
    
    // Toggle the active class on the sidebar
    sidebar.classList.toggle("active");
  
    // Toggle the change class on the button to animate the bars into a cross
    toggleBtn.classList.toggle("change");
}   
