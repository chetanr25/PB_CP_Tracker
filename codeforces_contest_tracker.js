// It's not JS, its GS

function fetchLatestContestAndRanks() {
  var sheetID = "1h5AXAPMB6t-eNESvXDloCx7WatqgWlOWQZG17QQDDE0"; // PB
  var sheet = SpreadsheetApp.openById(sheetID).getSheetByName("CodeForce");
  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    SpreadsheetApp.getUi().alert(
      "The sheet is empty or does not have enough data."
    );
    return;
  }

  const headerRow = data[0];
  const idColIndex = headerRow.indexOf("CODEFORCES ID");
  const nameColIndex = headerRow.indexOf("NAME");

  if (idColIndex === -1 || nameColIndex === -1) {
    SpreadsheetApp.getUi().alert(
      "Ensure columns have 'CODEFORCES ID' and 'Name' headers."
    );

    return;
  }

  let latestContestName = "";
  let latestContestId = "";
  try {
    const contestApiUrl = "https://codeforces.com/api/contest.list?gym=false";

    const contestResponse = UrlFetchApp.fetch(contestApiUrl);
    const contestResult = JSON.parse(contestResponse.getContentText());

    if (contestResult.status === "OK") {
      const contests = contestResult.result;
      for (let contest of contests) {
        if (contest.phase === "FINISHED") {
          latestContestName = contest.name;
          latestContestId = contest.id;

          break;
        }
      }
    } else {
      throw new Error("Failed to fetch contests.");
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert(
      "Failed to fetch the latest contest information."
    );
    return;
  }

  let latestContestColIndex = headerRow.indexOf(latestContestName);
  if (latestContestColIndex === -1) {
    latestContestColIndex = headerRow.length;
    sheet.getRange(1, latestContestColIndex + 1).setValue(latestContestName);
  }

  const nonParticipants = [];
  const nonParticipantsLink = [];
  const nonParticipantsNames = [];

  for (let i = 1; i < data.length; i++) {
    let codeforcesID = data[i][idColIndex];
    let userName = data[i][nameColIndex];

    if (!codeforcesID) {
      continue;
    }

    if (codeforcesID.startsWith("https://codeforces.com/profile/")) {
      codeforcesID = codeforcesID.split("/profile/")[1];
    }

    try {
      const rankApiUrl = `https://codeforces.com/api/contest.standings?contestId=${latestContestId}&handles=${codeforcesID}`;

      const rankResponse = UrlFetchApp.fetch(rankApiUrl, {
        muteHttpExceptions: true,
      });
      const rankResult = JSON.parse(rankResponse.getContentText());

      const ratingApiUrl = `https://codeforces.com/api/user.rating?handle=${codeforcesID}`;

      const ratingResponse = UrlFetchApp.fetch(ratingApiUrl, {
        muteHttpExceptions: true,
      });
      const ratingResult = JSON.parse(ratingResponse.getContentText());

      if (rankResult.status === "OK") {
        let contestRank = "NO";
        if (rankResult.result.rows.length > 0) {
          contestRank = rankResult.result.rows[0].rank;
        }

        let userRating = "No Rating Data";
        if (ratingResult.status === "OK" && ratingResult.result.length > 0) {
          const latestRating =
            ratingResult.result[ratingResult.result.length - 1];
          userRating = latestRating.newRating;
        }

        let formattedResult;
        if (contestRank === "NO") {
          formattedResult = `  -  `;

          nonParticipants.push(userName);
          nonParticipantsLink.push(
            `https://codeforces.com/profile/${codeforcesID}`
          );
        } else {
          formattedResult = `YES , S : (${contestRank}) Rank : (${userRating})`;
        }

        sheet
          .getRange(i + 1, latestContestColIndex + 1)
          .setValue(formattedResult);
      } else {
        sheet.getRange(i + 1, latestContestColIndex + 1).setValue("  -  ");
      }
    } catch (error) {
      sheet.getRange(i + 1, latestContestColIndex + 1).setValue("-");
    }
  }

  if (nonParticipants.length > 0) {
    sendEmail(nonParticipants, nonParticipantsLink, latestContestName);
  }
}

/**
 * Send email with a list of non-participants.
 * @param {Array} nonParticipants - List of usernames who didn't participate.
 * @param {Array} nonParticipantsLink - List of URLs to non-participants' profiles.
 * @param {string} contestName - The name of the contest.
 */
function sendEmail(nonParticipants, nonParticipantsLink, contestName) {
  var index = 0;
  const emailBody = `<html>
        <body>
          <h3>Non-Participants in ${contestName}</h3>
          <p>The following users did not participate in the latest contest:</p>
          <ul>
            ${nonParticipants
              .map((user) => {
                const profileUrl = nonParticipantsLink[index];
                index++;
                return `<li><a href="${profileUrl}" target="_blank">${user}</a></li>`;
              })
              .join("")}
          </ul>
        </body>
      </html>`;

  const emailSubject = `Codeforces Non-Participants Report for ${contestName}`;
  const emails = [
    "gautamshorewalavis@gmail.com",
    "yuvrajshorewalavis@gmail.com",
    "adityahasanpur2004@gmail.com",
    "chetan250204@gmail.com",
  ];
  for (var i = 0; i < emails.length; i++) {
    MailApp.sendEmail({
      to: emails[i],
      subject: emailSubject,
      htmlBody: emailBody,
    });
  }
}
