import UserRating from './rating.js';
import './style.css';

const ratingStars = document.createElement("main") as HTMLElement;
ratingStars.className = "rating-stars";

const notification = document.createElement("section") as HTMLElement;
notification.id = "notification";

const starWidgets = document.createElement("form") as HTMLFormElement;
starWidgets.id = "star-widgets";
starWidgets.title = "rating-fields";

const stars = document.createElement("section") as HTMLElement;
stars.className = "stars";

const rating5 = document.createElement("input") as HTMLInputElement;
rating5.type = "radio";
rating5.name = "rate";
rating5.title = "rating-radio";
rating5.id = "rate-5";

const rating4 = document.createElement("input") as HTMLInputElement;
rating4.type = "radio";
rating4.name = "rate";
rating4.title = "rating-radio";
rating4.id = "rate-4";

const rating3 = document.createElement("input") as HTMLInputElement;
rating3.type = "radio";
rating3.name = "rate";
rating3.title = "rating-radio";
rating3.id = "rate-3";

const rating2 = document.createElement("input") as HTMLInputElement;
rating2.type = "radio";
rating2.name = "rate";
rating2.title = "rating-radio";
rating2.id = "rate-2";

const rating1 = document.createElement("input") as HTMLInputElement;
rating1.type = "radio";
rating1.name = "rate";
rating1.title = "rating-radio";
rating1.id = "rate-1";

const username = document.createElement("input") as HTMLInputElement;
rating1.type = "text";
rating1.placeholder = "insert-name...";
rating1.id = "username";


/*
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <main class="rating-stars">
        <section id="notification"></section>
        <section id="ratings-list"></section>
        <form title="rating-fields" id="star-widgets">
            <section class="stars">
                <input type="radio" name="rate" id="rate-5" value="5" title="rating-radio"/>
                <label for="rate-5"><i class="fa-solid fa-star"></i></label>
                <input type="radio" name="rate" id="rate-4" value="4" title="rating-radio"/>
                <label for="rate-4"><i class="fa-solid fa-star"></i></label>
                <input type="radio" name="rate" id="rate-3" value="3" title="rating-radio"/>
                <label for="rate-3"><i class="fa-solid fa-star"></i></label>
                <input type="radio" name="rate" id="rate-2" value="2" title="rating-radio"/>
                <label for="rate-2"><i class="fa-solid fa-star"></i></label>
                <input type="radio" name="rate" id="rate-1" value="1" title="rating-radio"/>
                <label for="rate-1"><i class="fa-solid fa-star"></i></label>
            </section>
            <section id="writing">
                <input type="text" placeholder="insert-name" id="username"/>
                <textarea placeholder="insert-your-opinion" id="comment"></textarea>
                <div>
                    <button type="submit" id="save-btn">Send</button>
                    <button type="button" id="clear-form">Clear</button>
                </div>
            </section>
        </form>
    </main>
`;
*/


let user: UserRating;

function init(): void {
    user = new UserRating(starWidgets, username);
    user.showAllRatings();
}

function teardown(): void {
    user.cleanUp();
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", teardown);