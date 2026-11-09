package com.family.growth.web;

import com.family.growth.common.ApiResponse;
import com.family.growth.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final StorageService storageService;

    /** 上传单个文件（照片 / 视频） */
    @PostMapping("/upload")
    public ApiResponse<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        String url = storageService.store(file);
        return ApiResponse.ok(Map.of("url", url));
    }

    /** 批量上传 */
    @PostMapping("/batch")
    public ApiResponse<List<String>> batch(@RequestParam("files") MultipartFile[] files) {
        List<String> urls = Arrays.stream(files).map(storageService::store).toList();
        return ApiResponse.ok(urls);
    }
}
