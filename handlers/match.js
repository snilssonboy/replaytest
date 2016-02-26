var Dota2 = require("../index"),
    util = require("util");

Dota2._matchOptions = {
        hero_id: "number",
        game_mode: "number",
        date_min: "number",
        date_max: "number",
        matches_requested: "number",
        start_at_match_id: "number",
        min_players: "number",
        tournament_games_only: "boolean",
        account_id: "number",
        league_id: "number",
        skill: "number",
        team_id: "number"
};

// Methods
Dota2.Dota2Client.prototype.requestMatches = function(criteria, callback) {
    criteria = criteria || [];
    callback = callback || null;
    var _self = this;
    
    /* Sends a message to the Game Coordinator requesting a list of matches based on the given criteria. Listen for `matchData` event for Game Coordinator's response. */
    if (this.debug) util.log("Sending match request");

    var matchOptions = Dota2._parseOptions(criteria, Dota2._matchOptions);
    matchOptions.matches_requested = matchOptions.matches_requested || 1;

    var payload = new Dota2.schema.CMsgDOTARequestMatches(matchOptions);
    this.sendToGC(  Dota2.schema.EDOTAGCMsg.k_EMsgGCRequestMatches, 
                    payload, 
                    onMatchesResponse, callback);
}

Dota2.Dota2Client.prototype.requestMatchDetails = function(match_id, callback) {
    callback = callback || null;
    var _self = this;
    
    /* Sends a message to the Game Coordinator requesting `match_id`'s match details.  Listen for `matchData` event for Game Coordinator's response. */
    if (this.debug) util.log("Sending match details request");
    
    var payload = new Dota2.schema.CMsgGCMatchDetailsRequest({
        "match_id": match_id
    });
    this.sendToGC(  Dota2.schema.EDOTAGCMsg.k_EMsgGCMatchDetailsRequest, 
                    payload, 
                    onMatchDetailsResponse, callback);
};

Dota2.Dota2Client.prototype.requestMatchmakingStats = function() {
    /* Sends a message to the Game Coordinator requesting `match_id`'s match deails.  Listen for `matchData` event for Game Coordinator's response. */
    // Is not Job ID based - can't do callbacks.
    if (this.debug) util.log("Sending matchmaking stats request");
    
    var payload = new Dota2.schema.CMsgDOTAMatchmakingStatsRequest({});
    this.sendToGC(Dota2.schema.EDOTAGCMsg.k_EMsgGCMatchmakingStatsRequest, payload);
};


// Handlers

var handlers = Dota2.Dota2Client.prototype._handlers;

var onMatchesResponse = function onMatchesResponse(message, callback) {
    callback = callback || null;
    var matchResponse = Dota2.schema.CMsgDOTARequestMatchesResponse.decode(message);
    if (matchResponse.total_results > 1) {
        if (this.debug) util.log("Reveived listing for matches");
        this.emit("matchesData",
            matchResponse.total_results,
            matchResponse.results_remaining,
            matchResponse.matches,
            matchResponse.series,
            matchResponse);
        if (callback) callback(null, matchResponse);
    } else {
        if (this.debug) util.log("Received a bad matchesResponse");
        if (callback) callback(matchResponse.result, matchResponse);
    }
};
handlers[Dota2.schema.EDOTAGCMsg.k_EMsgGCRequestMatchesResponse] = onMatchesResponse;

var onMatchDetailsResponse = function onMatchDetailsResponse(message, callback) {
    callback = callback || null;
    var matchDetailsResponse = Dota2.schema.CMsgGCMatchDetailsResponse.decode(message);

    if (matchDetailsResponse.result === 1) {
        /*if (this.debug)*/
        util.log("Received match data for: " + matchDetailsResponse.match.match_id);
        this.emit("matchDetailsData",
            matchDetailsResponse.match.match_id,
            matchDetailsResponse);
        if (callback) callback(null, matchDetailsResponse);
    } else {
        if (this.debug) util.log("Received a bad matchDetailsResponse");
        if (callback) callback(matchDetailsResponse.result, matchDetailsResponse);
    }
};
handlers[Dota2.schema.EDOTAGCMsg.k_EMsgGCMatchDetailsResponse] = onMatchDetailsResponse;

var onMatchmakingStatsResponse = function onMatchmakingStatsResponse(message) {
    // Is not Job ID based - can't do callbacks.
    var matchmakingStatsResponse = Dota2.schema.CMsgDOTAMatchmakingStatsResponse.decode(message);

    if (this.debug) util.log("Received matchmaking stats");
    this.emit("matchmakingStatsData",
        matchmakingStatsResponse.searching_players_by_group_source2,
        matchmakingStatsResponse.disabled_groups_source2,
        matchmakingStatsResponse);
};
handlers[Dota2.schema.EDOTAGCMsg.k_EMsgGCMatchmakingStatsResponse] = onMatchmakingStatsResponse;