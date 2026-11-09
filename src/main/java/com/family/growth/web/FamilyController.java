package com.family.growth.web;

import com.family.growth.common.ApiResponse;
import com.family.growth.service.AuthService;
import com.family.growth.service.FamilyService;
import com.family.growth.web.dto.AuthDtos;
import com.family.growth.web.dto.FamilyDtos;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/family")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;
    private final AuthService authService;

    /** 我的家庭（含成员列表） */
    @GetMapping
    public ApiResponse<FamilyDtos.FamilyDto> myFamily() {
        return ApiResponse.ok(familyService.familyDto(familyService.currentFamilyId()));
    }

    /** 修改家庭信息 */
    @PutMapping
    public ApiResponse<FamilyDtos.FamilyDto> update(@RequestBody FamilyDtos.FamilyUpdateReq req) {
        return ApiResponse.ok(familyService.updateFamily(req));
    }

    /** 重新生成邀请码 */
    @PostMapping("/invite/regenerate")
    public ApiResponse<FamilyDtos.FamilyDto> regenerateInvite() {
        return ApiResponse.ok(familyService.regenerateInviteCode());
    }

    /** 使用邀请码加入家庭（邀请配偶/家人） */
    @PostMapping("/join")
    public ApiResponse<AuthDtos.AuthResp> join(@Valid @RequestBody FamilyDtos.JoinReq req) {
        familyService.joinByInviteCode(req.inviteCode());
        return ApiResponse.ok(authService.current());
    }

    /** 添加子女/家庭成员 */
    @PostMapping("/members")
    public ApiResponse<FamilyDtos.FamilyDto> addMember(@Valid @RequestBody FamilyDtos.MemberReq req) {
        return ApiResponse.ok(familyService.addMember(req));
    }

    /** 编辑成员 */
    @PutMapping("/members/{id}")
    public ApiResponse<FamilyDtos.FamilyDto> updateMember(@PathVariable Long id,
                                                          @Valid @RequestBody FamilyDtos.MemberReq req) {
        return ApiResponse.ok(familyService.updateMember(id, req));
    }

    /** 删除成员 */
    @DeleteMapping("/members/{id}")
    public ApiResponse<FamilyDtos.FamilyDto> deleteMember(@PathVariable Long id) {
        return ApiResponse.ok(familyService.deleteMember(id));
    }
}
