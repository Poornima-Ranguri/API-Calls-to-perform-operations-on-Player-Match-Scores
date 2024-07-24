const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerArrayToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details ORDER BY player_id;`;
  const playersArray = await database.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerArrayToResponseObject(eachPlayer)
    )
  );
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayerArrayToResponseObject(player));
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
        UPDATE 
            player_details
        SET 
            player_name = '${playerName}'
        WHERE
             player_id = ${playerId};`;

  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4 Match Specific

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const match = await database.get(getMatchQuery);
  response.send(convertMatchToResponseObject(match));
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayerQuery = `
        SELECT
          *
        FROM player_match_score
             NATURAL JOIN match_details 
        WHERE
            player_id = ${playerId};  

    `;
  const matches = await database.all(getMatchPlayerQuery);
  response.send(
    matches.map((eachMatch) => convertMatchToResponseObject(eachMatch))
  );
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
      *
    FROM  player_details
        NATURAL JOIN 
            player_match_score
    WHERE 
        match_id = ${matchId};       
  `;

  const matchArray = await database.all(getMatchQuery);
  response.send(
    matchArray.map((eachPlayer) =>
      convertPlayerArrayToResponseObject(eachPlayer)
    )
  );
});

//API 7

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;

  const statisticsQuery = `
    SELECT 
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM player_match_score
        NATURAL JOIN player_details
    WHERE 
        player_id = ${playerId};           
  `;

  const result = await database.get(statisticsQuery);
  response.send(result);
});

module.exports = app;
