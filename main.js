"use strict";

(async () => {

    const selectedCoins = [];
    let coinSelectionModal;
    let coinToReplace;
    let coins;

    // Menu Events


    const homeLink = document.getElementById("homeLink");
    homeLink.addEventListener("click", () => {
        selectedCoins.length = 0;
        createHome();
        setActiveLink("homeLink");
    });

    const reportsLink = document.getElementById("reportsLink");
    reportsLink.addEventListener("click", function (event) {
        event.preventDefault();

        if (selectedCoins.length > 5) {
            showCoinSelectionModal();
        }
        createReports();
        setActiveLink("reportsLink");
    });

    const aboutLink = document.getElementById("aboutLink");
    aboutLink.addEventListener("click", () => {
        createAbout();
        setActiveLink("aboutLink");
    });

    function setActiveLink(activeLinkId) {
        const links = document.querySelectorAll('nav a');
        links.forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.getElementById(activeLinkId);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", searchCoin);

    document.addEventListener("DOMContentLoaded", () => {
        createHome();
        setActiveLink("homeLink");
    });


    // AJAX

    async function getJson(url) {
        const response = await fetch(url);
        const json = await response.json();
        return json;
    }

    // Choose 5 coins into array

    function handleCoinSelection() {
        const coinId = this.getAttribute("data-coin-id");
        const index = selectedCoins.indexOf(coinId);

        if (index === -1) {  // Coin is not already selected
            if (selectedCoins.length < 5) {
                selectedCoins.push(coinId);
            } else if (selectedCoins.length === 5) {
                coinToReplace = coinId;
                showCoinSelectionModal();
            }
        } else {
            selectedCoins.splice(index, 1);
        }

        localStorage.setItem('selectedCoins', JSON.stringify(selectedCoins));
        console.log("Selected Coins:", selectedCoins);
    }



    function showCoinSelectionModal() {
        const selectedCoinsList = document.getElementById("selectedCoinsList");

        // Populate the modal's dropdown
        selectedCoinsList.innerHTML = selectedCoins.map(coinId => `<option value=${coinId}>${coinId}</option>`).join('');

        // Initialize Modal
        coinSelectionModal = new bootstrap.Modal(document.getElementById("coinSelectionModal"), {
            backdrop: 'static',
            keyboard: false
        });

        coinSelectionModal.show();
    }


    // Remove the selection

    window.replaceSelectedCoin = function () {
        const selectedCoinsList = document.getElementById("selectedCoinsList");
        const oldCoinId = selectedCoinsList.value;
        const index = selectedCoins.indexOf(oldCoinId);

        // If the selected coin exists, remove it
        if (index !== -1) {
            selectedCoins.splice(index, 1);
            unSelectCard(oldCoinId); // Unselect this coin in the UI
        }

        // Add the new coin (coinToReplace) if it exists
        if (coinToReplace) {
            selectedCoins.push(coinToReplace);
            coinToReplace = null;
        }

        // Save the updated selectedCoins list to localStorage
        localStorage.setItem('selectedCoins', JSON.stringify(selectedCoins));

        // Hide the coin selection modal
        coinSelectionModal.hide();

        // Check if there are more than 5 coins selected
        if (selectedCoins.length > 5) {
            showCoinSelectionModal();
        }
    };



    function unSelectCard(coinId) {
        const cardSelectButtons = document.querySelectorAll(".form-check-input");

        // Find and uncheck the specific coin
        const selectorToTurnOff = Array.from(cardSelectButtons).find(selector => selector.getAttribute('data-coin-id') === coinId);

        if (selectorToTurnOff) {
            selectorToTurnOff.checked = false;
        }

        console.log("Coin with ID", coinId, "has been unselected.");
    }


    // Create Home

    async function createHome() {
        coins = await getJson("assets/json/coins1.json");
        console.log(coins);
        displayCoins(coins);
    }

    function displayCoins(coins) {
        const bodyContainer = document.getElementById("bodyContainer");
        let content = "";

        for (let i = 0; i < coins.length; i++) {
            const div = `
            <div id="card-search${i}" class="card">
               <div class="form-check form-switch">
                 <input data-coin-id="${coins[i].id}" class="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault">
               </div>
             <img src="${coins[i].image.large}" class="coinImg">
                  <div class="coinSymbol">${coins[i].symbol}</div>
                  <div class="coinName">${coins[i].name}</div>
                  <button id="btn${i}" data-coin-id="${coins[i].id}" class="moreInfo">More Info</button>
                  <div class="moreInfo hidden"></div>
            </div>
            `;
            content += div;
        }

        searchInput.style.display = "block";

        bodyContainer.innerHTML = content;

        // More info

        const buttons = document.querySelectorAll(".card > button");
        for (const btn of buttons) {
            btn.addEventListener("click", toggleMoreInfo);
        }

        const cardSelectButtons = document.querySelectorAll(".form-check-input");
        for (const selector of cardSelectButtons) {
            selector.addEventListener("click", handleCoinSelection);
        }
    }

    async function toggleMoreInfo() {
        const coinId = this.getAttribute("data-coin-id");
        const div = document.querySelector(`button[data-coin-id="${coinId}"] + div`);
        const prices = await getMoreInfo(coinId);
        div.innerHTML = `
           <div class="currencies">
        <p>USD: $${prices.usd}</p>
        <p>EUR: €${prices.eur}</p>
        <p>ILS: ₪${prices.ils}</p>
        </div>
     `;
        div.classList.toggle("hidden");
    }

    async function getMoreInfo(coinId) {
        let prices = JSON.parse(localStorage.getItem(coinId));
        if (prices) return prices;
        const url = "https://api.coingecko.com/api/v3/coins/" + coinId;
        const coinInfo = await getJson(url);
        console.log(coinInfo);
        const usd = coinInfo.market_data.current_price.usd;
        const eur = coinInfo.market_data.current_price.eur;
        const ils = coinInfo.market_data.current_price.ils;
        prices = { usd, eur, ils };
        localStorage.setItem(coinId, JSON.stringify(prices));
        return prices;
    }

    function getCoinById(coinId) {
        return coins.find(coin => coin.id === coinId);
    }

    async function getCoinsWithPrices(coinsList) {
        const list = [];
        for (const coin of coinsList) {
            const data = await getJson(`https://api.coingecko.com/api/v3/coins/${coin.id}`);
            list.push(data);
        }
        return list;
    }

    // Search Bar

    async function searchCoin() {
        console.log("Search triggered");

        const searchText = searchInput.value.trim().toLowerCase();
        const coins = await getJson("assets/json/coins1.json");

        const coinsFilter = coins.filter(coin =>
            coin.symbol.toLowerCase().includes(searchText) ||
            coin.name.toLowerCase().includes(searchText)
        );

        displayCoins(coinsFilter);
    }

    // Create Reports

    async function createReports() {

        bodyContainer.style.height = "350px";
        searchInput.style.display = "none";

        if (bodyContainer) {
            bodyContainer.style.display = "block";
        }

        if (selectedCoins.length === 0) {

            if (bodyContainer) {
                bodyContainer.innerHTML = `
                <div class="reportErrorArea">
                    <h2>Selection Is Empty</h2>
                    <h3 class="errorText"> Please select at least one coin in order to generate reports.</h3>
                   </div> `;
            } else {
                console.error('chartContainer not found in HTML');
            }
            return;
        }

        const selectedDataCoins = selectedCoins.map(coinId => getCoinById(coinId)).filter(coin => coin);

        if (selectedDataCoins.length === 0) {
            console.error('No valid coins selected.');
            return;
        }

        const coinsWithPrices = await getCoinsWithPrices(selectedDataCoins);
        const dataPoints = coinsWithPrices.map(coin => ({
            label: coin.name,
            y: coin.market_data.current_price.usd,
        }));

        var chart = new CanvasJS.Chart("bodyContainer", {

            animationEnabled: true,

            theme: "light2",
            backgroundColor: "transparent",
            axisY: {
                exportEnabled: true,
                labelFontSize: 12,
            },
            axisX: {
                title: "Your Coins",
                scaleBreaks: {
                    autoCalculate: true,
                    lineColor: "white"
                },
                labelFontSize: 12,
                labelWrap: true,
                labelInterval: 1
            },
            data: [{
                type: "line",
                dataPoints: dataPoints.filter(item => item.y > 0)
            }]

        });

        chart.render();
    }

    // Create About

    function createAbout() {

        if (bodyContainer) {
            searchInput.style.display = "none";
            bodyContainer.innerHTML = `

            <div class="aboutContainer">
            <div class="introBox">
                 <h2>Hey there! I’m Tal.</h2>
        <p>
        A Tech Marketer turned Full-Stack Developer with 9+ years of experience leading digital projects. 
        <br><br>
        For the past 5 years at UVeye, I’ve developed digital platforms and marketing tools for a cutting-edge computer vision company, collaborating with industry leaders like Amazon, GM, and Toyota.
        <br><br>
        After completing Full-Stack Development training, I’m ready to apply my skills in building and optimizing web applications for my next challenge.
        </p>
            </div>
            <div class="photoContainer">
                <img id="headShot" src="assets/images/tal argaman.jpg" />
                `;
        } else {
            console.error('aboutContainer not found in HTML');
        }
    };
})();
