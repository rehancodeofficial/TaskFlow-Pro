package com.taskflow.backend.team.controller;

import com.taskflow.backend.common.response.ApiResponse;
import com.taskflow.backend.team.dto.CreateTeamRequest;
import com.taskflow.backend.team.entity.Team;
import com.taskflow.backend.team.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    public ResponseEntity<ApiResponse<Team>> createTeam(@Valid @RequestBody CreateTeamRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Team created successfully", teamService.createTeam(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Team>>> getTeams() {
        return ResponseEntity.ok(ApiResponse.success("Teams retrieved", teamService.getTeamsForCurrentTenant()));
    }
}
