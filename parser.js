

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

    const doc = await getDocumentFromUrl(threadsUrl);
    const threadsNodes = doc.querySelectorAll(threadsSelector)

    const threads = []

    for (const threadNode of threadsNodes) {
        const text = threadNode.textContent;
        const match = text.match(monthRegex);
        const month = match ? match[1].trim() : null;
        if (!month) continue;

        const link = threadNode.href;

        const thread = { month, link };
        threads.push(thread)
    }

    return threads;
}

async function getThreadUrlFromMonth(month) {
    const threads = await getThreads();

    const thread = threads.find(thread => thread.month === month);
    const link = thread.link;

    return link;
}

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

async function getCompanies(threadUrl) {
    const postsSelector = '.athing.comtr:has([indent="0"])';
    const titleChildSelector = '.commtext:first-child';
    const linkChildSelector = 'span.age a';

    // remove url after name
    const companyNameRegex = /^([^|]+)\|/;

    const doc = await getDocumentFromUrl(threadUrl);
    const postsNodes = doc.querySelectorAll(postsSelector)
    
    const companies = []

    for (const postNode of postsNodes) {
        const titleNode = postNode.querySelector(titleChildSelector);
        if (!titleNode) continue;

        const titleText = titleNode.textContent.trim(); 
        const match = titleText.match(companyNameRegex); 
        const name = match ? match[1].trim() : null;
        if (!name) continue;

        const linkNode = postNode.querySelector(linkChildSelector);
        const link = linkNode.href;

        const company = { name, link };
        companies.push(company);
    }

    return companies
}

async function getCompaniesForMonth(threadUrl) {
    const pagesUrls = await getPagesUrlsForMonth(threadUrl);

    const allCompanies = []

    for (const pageUrl of pagesUrls) {
        const companies = await getCompanies(pageUrl);
        allCompanies.push(...companies);
    }

    return allCompanies;
}

function compareCompanies(company1, company2) {
    const isEqual = company1.name === company2.name;
    return isEqual;
}

function getNewAndOldCompanies(companies1, companies2) {

    const newCompanies = [];
    const oldCompanies = [];

    for (const company2 of companies2) {
        let isNew = true;
        for (const company1 of companies1) {
            const isEqual = compareCompanies(company1, company2);
            if (isEqual) {
                isNew = false;
            }           
        }
        if (isNew) {
            newCompanies.push(company2);
        } else {
            oldCompanies.push(company2);
        }
    }

    const result = { newCompanies, oldCompanies };
    return result;
}

function printResult(result) {
    const { newCompanies, oldCompanies } = result;

    const output = { 
        newCompanies,
        newCount: newCompanies.length,
        newNames: newCompanies.map(company => company.name),
        oldCompanies,
        oldCount: oldCompanies.length,
        oldNames: oldCompanies.map(company => company.name),
    };

    return output;
}

async function main(month1, month2) {
    const threadUrl1 = await getThreadUrlFromMonth(month1);
    const threadUrl2 = await getThreadUrlFromMonth(month2);

    const companies1 = await getCompaniesForMonth(threadUrl1);
    const companies2 = await getCompaniesForMonth(threadUrl2);

    const result = getNewAndOldCompanies(companies1, companies2);
    const output = printResult(result);

    return output;
}

await main('March', 'April');


