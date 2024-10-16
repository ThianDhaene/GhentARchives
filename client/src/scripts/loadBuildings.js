async function fetchMonumenten() {
    const endpoint = "https://data.collectie.gent/sparql";
    const query = `
        PREFIX cidoc: <http://www.cidoc-crm.org/cidoc-crm/>
        PREFIX dcterms: <http://purl.org/dc/terms/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

        SELECT ?gebouw ?naam ?beschrijving
        FROM <http://stad.gent/ldes/collectie>
        WHERE {
            ?gebouw a cidoc:E22_Man-Made_Object ;
                    rdfs:label ?naam ;
                    dcterms:description ?beschrijving .

            FILTER (lang(?naam) = "nl" && lang(?beschrijving) = "nl")
        } LIMIT 100
    `;

    const url = `${endpoint}?query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
        headers: {
            'Accept': 'application/sparql-results+json'
        }
    });

    const data = await response.json();
    return data.results.bindings;
}

// Functie om de monumenten in de lijst weer te geven
function toonMonumenten(monumenten) {
    const lijstElement = document.getElementById('monumenten-lijst');
    lijstElement.innerHTML = ''; // Maak de lijst leeg

    monumenten.forEach(monument => {
        const naam = monument.naam.value;
        const beschrijving = monument.beschrijving.value;

        // Maak een lijstitem voor elk monument
        const listItem = document.createElement('li');
        listItem.textContent = `${naam}: ${beschrijving}`;
        lijstElement.appendChild(listItem);
    });
}

// Fetch de monumenten en toon ze in de lijst
fetchMonumenten().then(toonMonumenten).catch(error => {
    console.error("Fout bij het ophalen van monumenten:", error);
});