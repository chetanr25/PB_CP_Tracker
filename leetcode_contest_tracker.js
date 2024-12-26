function updateLeetCodeRatings() {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("Leetcode");
  
    if (!sheet) {
      Logger.log("Sheet named 'Leetcode' not found!");
      return;
    }
  
    const dataRange = sheet.getDataRange();
    const data = dataRange.getValues();
  
    const lastColumnIndex = sheet.getLastColumn();
    const newContestName = `Weekly Contest ${429 + lastColumnIndex - 3}`; 
    const newContestColumnIndex = lastColumnIndex + 1;
  
    sheet.getRange(1, newContestColumnIndex).setValue(newContestName);
  
    const nonParticipants = [];
    const nonParticipantsLinks = [];
  
    for (let i = 1; i < data.length; i++) {
      const profileLink = data[i][2]; // URL is in column C
      const previousRating = data[i][lastColumnIndex - 1] ? data[i][lastColumnIndex - 1].toString().trim() : null;
  
      let username = "";
      if (profileLink) {
        username = extractUsernameFromUrl(profileLink);
      }
  
      let currentRating = "";
      if (username) {
        currentRating = getLeetCodeRating(username);
      }
  
      sheet.getRange(i + 1, newContestColumnIndex).setValue(currentRating || "No rating");
  
      if (currentRating && currentRating === previousRating) {
        nonParticipants.push(username || "Unknown User");
        nonParticipantsLinks.push(profileLink);
      }
    }
  
    if (nonParticipants.length > 0) {
      sendNonParticipationEmail(nonParticipants, nonParticipantsLinks);
    }
  }
  
  function extractUsernameFromUrl(url) {
    try {
      const parts = url.split("/");
      return parts[parts.length - 2] || ""; 
    } catch (error) {
      Logger.log(`Error extracting username from URL (${url}): ${error}`);
      return "";
    }
  }
  
  function getLeetCodeRating(username) {
    const url = `https://pb-cp-tracker.onrender.com/leetcode?username=${username}`;
    try {
      const response = UrlFetchApp.fetch(url);
      const rating = response.getContentText().trim();
  
      // Handle "unrated" or valid ratings
      return rating === "unrated" ? "Unrated" : rating;
    } catch (error) {
      Logger.log(`Error fetching rating for ${username}: ${error}`);
      return "Error fetching data";
    }
  }
  
  function sendNonParticipationEmail(nonParticipants, nonParticipantsLinks) {
    const emailBody = `
      <html>
        <body>
          <h3>Non-Participants in Latest Contest</h3>
          <p>The following users did not participate in the latest contest:</p>
         <ul>
            ${nonParticipants.map((user, index) => {
              const profileUrl = nonParticipantsLinks[index];
              return `<li><a href="${profileUrl}" target="_blank">${user}</a></li>`;
            }).join('')}
          </ul>
        </body>
      </html>
    `;
    const emailSubject = "LeetCode Non-Participants Report";
    const recipientEmails = ['gautamshorewalavis@gmail.com' ,'yuvrajshorewalavis@gmail.com', 'adityahasanpur2004@gmail.com','chetan250204@gmail.com']; 
  
    for (const email of recipientEmails) {
      MailApp.sendEmail({
        to: email,
        subject: emailSubject,
        htmlBody: emailBody
      });
    }
  }
  