    /**
     * dropdown on navbar
     */
    $(document).ready(function () {
    $('.sidenav').sidenav();
    $(".dropdown-trigger").dropdown();
    $(".dropdown-trigger2").dropdown();
    $('.collapsible').collapsible();
    var intelligenceText = sessionStorage.getItem('text');
    var intelligenceColor = sessionStorage.getItem('color');
    console.log(intelligenceColor);
    console.log(intelligenceText);
    /**
     * shows whether or not intelligent control is on or off on the navbar
     */
    if((intelligenceText == 'on') && (intelligenceColor == 'on')) {
        console.log('inside on')
        document.getElementById("intelligence-control-on-off").innerText = "Intelligent Control On"
        document.getElementById("intelligent-control").style.backgroundColor = "green"
    } 
    if((intelligenceText == 'off') && (intelligenceColor == 'off')) {
        console.log('inside off')
        document.getElementById("intelligence-control-on-off").innerText = "Intelligent Control Off"
        document.getElementById("intelligent-control").style.backgroundColor = "red"
    }
})