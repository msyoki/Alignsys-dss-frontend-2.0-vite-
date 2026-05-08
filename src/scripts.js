
function validateEmail(email) {
    let res = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return res.test(email);
    }
    function validate(email) {
        let result = document.getElementById("result").value;
      
        result.text("");
        if(validateEmail(email)) {
            result.text(email + " is valid");
            result.css("color", "blue");
        } else {
            result.text(email + " invalid");
            result.css("color", "red");
        }
    return false;
}
function getValue(){
    const to=document.getElementById('to').value;
    if (to.indexOf(',') > -1)
    {
        // alert("split by ,");
        var emails= to.split(',')
        console.log(emails)
        emails.forEach(element => {
            console.log(element)
            validate(element)
        });
    }
    else if(to.indexOf(';') > -1){
        // alert("split by ;");
        var emails= to.split(';')
        console.log(emails)
        emails.forEach(element => {
            console.log(element)
            validate(element)
        });
    }
    else{
        validate(to)

    }
 

}
   