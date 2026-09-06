package com.taskflow.backend.analytics.controller;

import com.taskflow.backend.analytics.dto.DashboardMetrics;
import com.taskflow.backend.analytics.service.AnalyticsService;
import com.taskflow.backend.common.response.ApiResponse;
import com.taskflow.backend.common.util.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardMetrics>> getDashboard() {
        DashboardMetrics metrics = analyticsService.getDashboardMetrics(TenantContext.getTenantId());
        return ResponseEntity.ok(ApiResponse.success("Dashboard metrics retrieved", metrics));
    }
}
