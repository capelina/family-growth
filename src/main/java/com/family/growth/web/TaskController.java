package com.family.growth.web;

import com.family.growth.common.ApiResponse;
import com.family.growth.service.TaskService;
import com.family.growth.web.dto.TaskDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    /** 任务列表 / 任务看板 */
    @GetMapping
    public ApiResponse<List<TaskDtos.TaskDto>> list(@RequestParam(required = false) String status,
                                                    @RequestParam(required = false) Long assigneeMemberId) {
        return ApiResponse.ok(taskService.list(status, assigneeMemberId));
    }

    /** 发布任务 */
    @PostMapping
    public ApiResponse<TaskDtos.TaskDto> create(@Valid @RequestBody TaskDtos.TaskReq req) {
        return ApiResponse.ok(taskService.create(req));
    }

    /** 修改任务 */
    @PutMapping("/{id}")
    public ApiResponse<TaskDtos.TaskDto> update(@PathVariable Long id,
                                                @Valid @RequestBody TaskDtos.TaskReq req) {
        return ApiResponse.ok(taskService.update(id, req));
    }

    /** 删除任务 */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        taskService.delete(id);
        return ApiResponse.ok();
    }

    /** 限时任务：孩子点击「开始」启动倒计时 */
    @PostMapping("/{id}/start")
    public ApiResponse<TaskDtos.TaskDto> start(@PathVariable Long id) {
        return ApiResponse.ok(taskService.start(id));
    }

    /** 孩子提交凭证（照片/录像） */
    @PostMapping("/{id}/submit")
    public ApiResponse<TaskDtos.SubmissionDto> submit(@PathVariable Long id,
                                                      @RequestBody TaskDtos.SubmitReq req) {
        return ApiResponse.ok(taskService.submit(id, req));
    }

    /** 家长审核通过 / 退回 */
    @PostMapping("/{id}/review")
    public ApiResponse<TaskDtos.TaskDto> review(@PathVariable Long id,
                                                @RequestBody TaskDtos.ReviewReq req) {
        return ApiResponse.ok(taskService.review(id, req));
    }

    /** 某任务的提交记录 */
    @GetMapping("/{id}/submissions")
    public ApiResponse<List<TaskDtos.SubmissionDto>> submissions(@PathVariable Long id) {
        return ApiResponse.ok(taskService.submissions(id));
    }

    /** 待审核提交 */
    @GetMapping("/pending-submissions")
    public ApiResponse<List<TaskDtos.SubmissionDto>> pending() {
        return ApiResponse.ok(taskService.pendingSubmissions());
    }
}
