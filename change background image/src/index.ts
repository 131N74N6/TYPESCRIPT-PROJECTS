const clock = document.querySelector("div#clock") as HTMLDivElement;
const date = document.querySelector("div#date") as HTMLDivElement;
let backgroundSettings;

function backgroundChange(){
    backgroundSettings = setTimeout(backgroundChange, 1500);
    let images = document.body.style;
    if (images.backgroundImage=='url("./images/img1.jpg")') {
        images.backgroundImage='url("./images/img2.jpg")';
    }
    else if(images.backgroundImage=='url("./images/img2.jpg")') {
        images.backgroundImage='url("./images/img3.jpg")';
    }
    else if(images.backgroundImage=='url("./images/img3.jpg")') {
        images.backgroundImage='url("./images/img4.jpg")';
    }
    else if(images.backgroundImage=='url("./images/img4.jpg")') {
        images.backgroundImage='url("./images/img5.jpg")';
    }
    else if(images.backgroundImage=='url("./images/img5.jpg")') {
        images.backgroundImage='url("./images/img6.jpg")';
    }
    else{
        images.backgroundImage='url("./images/img1.jpg")';
    }
    images.transition="opacity(2s ease-in-out)";
}

//show time and date
let setTimes;
let setDates;
function digitalClock(){
    setTimes = setTimeout(digitalClock);
    const timeSetting = new Date();
    clock.innerHTML = timeSetting.toLocaleTimeString();
}
function dateMonthYear(){
    setDates = setTimeout(dateMonthYear);
    const settingDate = new Date();
    date.innerHTML = settingDate.toLocaleDateString();
}