async function getcall() {

    let meal = document.getElementById("search").value;

    let ingredients = document.getElementById("ingredients");


    // hide if empty
    if (meal.trim() === "") {

        ingredients.style.display = "none";

        return;
    }


    let response = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${meal}`
    );

    let data = await response.json();


    // if recipe not found
    if (!data.meals) {

        ingredients.style.display = "block";

        ingredients.innerHTML = `
            <h2>No recipe found</h2>
        `;

        return;
    }


    let recipe = data.meals[0];

    let ingredientlist = "";


    for (let i = 1; i <= 20; i++) {

        let ingredient = recipe[`strIngredient${i}`];

        let measure = recipe[`strMeasure${i}`];

        if (ingredient && ingredient.trim() !== "") {

            ingredientlist += `
                <li>${measure} ${ingredient}</li>
            `;
        }
    }


    // show container
    ingredients.style.display = "block";


    ingredients.innerHTML = `

        <h2>${recipe.strMeal}</h2>

        <img src="${recipe.strMealThumb}">

        <h3>Ingredients</h3>

        <ul>
            ${ingredientlist}
        </ul>

        <h3>Preparation Steps</h3>

        <ol>
            ${recipe.strInstructions
                .split(".")
                .map(step => step.trim())
                .filter(step => step !== "")
                .map(step => `<li>${step}.</li>`)
                .join("")}
        </ol>
    `;
}
