

async function getDocumentFromUrl(url) {
    const htmlContent = await (await fetch(url)).text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    return doc;
}

async function getThreads() {
    const threadsUrl = 'https://news.ycombinator.com/submitted?id=whoishiring';
    const threadsSelector = 'tr.athing span.titleline a';
    const monthRegex = /.*(?:hiring).*?\((\w+)/;
    const baseUrl = 'https://news.ycombinator.com/';


    const doc = await getDocumentFromUrl(threadsUrl);
    const threadsNodes = doc.querySelectorAll(threadsSelector)

    const threads = []

    for (const threadNode of threadsNodes) {
        const text = threadNode.textContent;
        const match = text.match(monthRegex);
        const month = match ? match[1].trim() : null;
        if (!month) continue;

        const link = baseUrl + threadNode.href;

        const thread = { month, link };
        threads.push(thread)
    }

    return threads;
}

// await getThreads();

async function getPagesUrlsForMonth(threadUrl) {
    const postsSelector = '.athing.comtr:has([indent="0"]) .commtext:first-child';

    const pagesUrls = []


    for (let page = 1; page < 10; page++) {
        const pageUrl = `${threadUrl}&p=${page}`;
        
        const doc = await getDocumentFromUrl(pageUrl);
        const postsNodes = doc.querySelectorAll(postsSelector);
        if (!(postsNodes.length > 0)) break;
        
        pagesUrls.push(pageUrl);
    }

    return pagesUrls;
}

let threadUrl = 'https://news.ycombinator.com/item?id=39894820';
await getPagesUrlsForMonth(threadUrl);

async function getCompanies(threadUrl) {
    const postsSelector = '.athing.comtr:has([indent="0"]) .commtext:first-child';
    const companyNameRegex = /^([^|]+)\|/;

    const doc = await getDocumentFromUrl(threadUrl);
    const postsNodes = doc.querySelectorAll(postsSelector)
    
    const companies = []

    for (const postNode of postsNodes) {
        const postText = postNode.textContent.trim(); 
        const match = postText.match(companyNameRegex); 
        const company = match ? match[1].trim() : null;
        if (!company) continue;

        companies.push(company)
    }

    return companies
}

let threadUrl = 'https://news.ycombinator.com/item?id=39894820';
await getCompanies(threadUrl)

async function getCompaniesForMonth(threadUrl) {
    const pagesUrls = getPagesUrlsForMonth(threadUrl);

    const allCompanies = []

    for (const pageUrl of pagesUrls) {
        const companies = await getCompanies(pageUrl);
        allCompanies.push(companies);
    }

    return allCompanies;
}

async function getNewAndOldCompanies(companies1, companies2) {

    const newCompanies = [];
    const oldCompanies = [];

    for (const company1 of companies1) {
        let isNew = true;
        for (const company2 of companies2) {
            if ( company1 === company2) {
                isNew = false;
            }
            
        }
        if (isNew) {
            newCompanies.push(company1);
        } else {
            oldCompanies.push(company1);
        }
    }

    const result = { newCompanies, oldCompanies };
    return result;
}


