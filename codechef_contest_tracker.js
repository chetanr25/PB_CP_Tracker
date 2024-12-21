// It's not JS, its GS 
var sheetID = "1h5AXAPMB6t-eNESvXDloCx7WatqgWlOWQZG17QQDDE0" // PB
var latestContestName;
var nonParticipants = [];
var nonParticipantsLink = [];

function processCodechefProfiles() {
  const sheet = SpreadsheetApp.openById(sheetID).getSheetByName("CodeChef")
  const rows = sheet.getDataRange().getValues(); // Get all data from the sheet
  const urls = rows.slice(1).map(row => row[2]); // Extract URLs from column A, skipping header
  const names = rows.slice(1).map(row => row[0]); // Extract URLs from column A, skipping header
  latestContestName = getAndUpdateLatestContestName(sheet)

  const results = scrapeCodechefData(urls, latestContestName,names); // Scrape all profiles
  const lastColumn = sheet.getLastColumn();
  sheet.getRange(2,lastColumn, results.length, 1).setValues(results.map(value => [value]));

  // Send email if there are non-participants
  if (nonParticipants.length > 0) {
    sendEmail(nonParticipants,nonParticipantsLink);
  }
}

function getAndUpdateLatestContestName(sheet) {
  const lastColumn = sheet.getLastColumn();
  const lastContestName = sheet.getRange(1, lastColumn).getValue();

  // Extract contest number and increment it
  const contestNumber = parseInt(lastContestName.match(/\d+/)?.[0], 10);
  if (isNaN(contestNumber)) {
    throw new Error("Invalid contest number format.");
  }

  const newContestName = lastContestName.replace(contestNumber, contestNumber + 1); 
  sheet.getRange(1, lastColumn+1).setValue(newContestName);

  return newContestName;
}


/**
 * Function to scrape data for multiple CodeChef profiles.
 * @param {Array} urls - List of profile URLs.
 * @param {string} latestContestName - Latest contest name to check participation.
 * @returns {Array} - List of objects with scraped data.
 */
function scrapeCodechefData(urls, latestContestName, names) {
  const results = [];
  var indx = -1
  urls.forEach(url => {
     indx++;
    if (!url) {
      // Skip empty or null values
      results.push(' ');
      return;
    }
    
    try {
      const html = UrlFetchApp.fetch(url).getContentText();
      const $ = Cheerio.load(html);
      
      // const username = url.split('/').pop(); // Extract username from URL
      const rating = $('.rating').eq(1).text().trim() || '-'; // Scrape rating
      const contestName = $('.contest-name a').first().text().trim() || '-'; // Scrape latest contest name
      
      const participated = contestName === latestContestName; // Check if user participated in the latest contest
      if(participated)
      results.push(rating);
      else{
      nonParticipants.push(names[indx]);
      nonParticipantsLink.push(urls[indx]);
      results.push('-')
       Utilities.sleep(300); // Sleep for 100 milliseconds
      }
    } catch (error) {
      // Bro will try once more before it fails completely :D
      try{
     
       const html = UrlFetchApp.fetch(url).getContentText();
      const $ = Cheerio.load(html);
      
      // const username = url.split('/').pop(); // Extract username from URL
      const rating = $('.rating').eq(1).text().trim() || '-'; // Scrape rating
      const contestName = $('.contest-name a').first().text().trim() || '-'; // Scrape latest contest name
      
      const participated = contestName === latestContestName; // Check if user participated in the latest contest
      if(participated)
      results.push(rating);
      else{
      nonParticipants.push(names[indx]);
      nonParticipantsLink.push(urls[indx]);
      results.push('-')
       Utilities.sleep(1000);
      }
      }
        catch (error){
          Utilities.sleep(1000);
          console.error(`Error scraping ${url}:\n ${error.message}`);
          nonParticipants.push(names[indx]);
          nonParticipantsLink.push(urls[indx]);
          results.push('-');
    }
    }
   
  });
  
  return results;
}

/**
 * Send email with a list of non-participants.
 * @param {Array} nonParticipants - List of usernames who didn't participate.
 */
function sendEmail(nonParticipants,nonParticipantsLink) {
  var index = 0;
  const emailBody = `
    <html>
      <body>
        <h3>Non-Participants in Latest Contest</h3>
        <p>The following users did not participate in the latest contest:</p>
        <ul>
      
          ${nonParticipants.map(user => {
             const profileUrl = nonParticipantsLink[index];
             index ++;
            return `<li><a href="${profileUrl}" target="_blank">${user}</a></li>`;
            }).join('')}
        </ul>
      </body>
    </html>
  `;
  
  const emailSubject = 'CodeChef Non-Participants Report';
  const emails = ['gautamshorewalavis@gmail.com' ,'yuvrajshorewalavis@gmail.com', 'adityahasanpur2004@gmail.com']
  for(var i; i< emails.length; i++){
    MailApp.sendEmail({
      to: emails[i],
      subject: emailSubject,
      htmlBody: emailBody
    });
  }
}
