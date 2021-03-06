// begin tracified_tab.js

function openCity(evt, cityName) {
    // Declare all variables
    var i, tabs, tablinks;

    // Get all elements with class="tabs" and hide them
    tabs = document.getElementsByClassName("tabcontent");
  	
    for (i = 0; i < tabs.length; i++) {
        tabs[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

// end tracified_tab.js