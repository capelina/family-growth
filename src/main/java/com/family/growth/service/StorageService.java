package com.family.growth.service;

import com.family.growth.common.BizException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * 本地文件存储：照片 / 视频。
 */
@Service
public class StorageService {

    private static final List<String> ALLOWED = List.of(
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
            "video/mp4", "video/webm", "video/quicktime");

    private final Path root;

    public StorageService(@Value("${app.upload-dir:./data/uploads}") String uploadDir) {
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("无法创建上传目录: " + root, e);
        }
    }

    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BizException("请选择要上传的文件");
        }
        String contentType = file.getContentType();
        if (contentType == null || ALLOWED.stream().noneMatch(contentType::startsWith)) {
            throw new BizException("仅支持上传图片或视频文件");
        }
        String ext = extensionOf(file.getOriginalFilename(), contentType);
        String folder = LocalDate.now().toString();
        Path targetDir = root.resolve(folder);
        String name = UUID.randomUUID().toString().replace("-", "") + ext;
        try {
            Files.createDirectories(targetDir);
            Path target = targetDir.resolve(name);
            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new BizException("文件保存失败，请重试");
        }
        return "/uploads/" + folder + "/" + name;
    }

    private String extensionOf(String originalFilename, String contentType) {
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase();
            if (ext.length() <= 6) {
                return ext;
            }
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            case "video/mp4" -> ".mp4";
            case "video/webm" -> ".webm";
            case "video/quicktime" -> ".mov";
            default -> ".jpg";
        };
    }
}
