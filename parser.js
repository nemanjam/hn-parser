

async function getCompanies() {

    const htmlContent = await (await fetch('https://news.ycombinator.com/item?id=39894820')).text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const posts = document.querySelectorAll('.athing.comtr:has([indent="0"]) .commtext:first-child')
    
    const companies = []

    const regex = /^([^|]+)\|/;

    for (const post of posts) {
        const postText = post.textContent.trim(); 
        const match = postText.match(regex); 
        const company = match ? match[1].trim() : null; 
        companies.push(company)
    }

    return companies
}

await getCompanies()

