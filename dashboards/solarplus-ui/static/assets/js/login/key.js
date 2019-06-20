function insertKey() {
    var siteKey = config.SITE_KEY;
    console.log("here");
    //document.getElementById("key").data-sitekey = siteKey;
    document.getElementsById("key").setAttribute("data-sitekey", "siteKey"); 
  };

insertKey();