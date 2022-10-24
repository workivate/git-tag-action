"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tag = void 0;
const core = __importStar(require("@actions/core"));
exports.tag = (octokit, options) => __awaiter(void 0, void 0, void 0, function* () {
    core.debug("options:" + JSON.stringify(options, null, 4));
    const tags = yield octokit.rest.repos.listTags({
        owner: options.owner,
        repo: options.repo
    });
    const alreadyTags = tags.data.some((tag) => {
        return tag.name === options.gitTagName;
    });
    if (alreadyTags) {
        core.debug("already tagged by listTags");
        return;
    }
    // logic
    try {
        const refRes = yield octokit.rest.git.getRef({
            owner: options.owner,
            repo: options.repo,
            ref: `refs/tags/${options.gitTagName}`
        });
        // @ts-expect-error: this condition is not needed. res.status should be 200. It is double check
        if (refRes.status === 404) {
            throw new Error("not found the ref");
        }
        core.debug("already tagged by ref:" + JSON.stringify(refRes));
        return; // already tagged
    }
    catch (error) {
        core.debug("expected error: " + (error === null || error === void 0 ? void 0 : error.message));
        try {
            // https://stackoverflow.com/questions/15672547/how-to-tag-a-commit-in-api-using-curl-command
            const tagRes = yield octokit.rest.git.createTag({
                tag: options.gitTagName,
                object: options.gitCommitSha,
                message: options.gitTagName,
                type: "commit",
                tagger: {
                    name: options.gitName,
                    email: options.gitEmail,
                    date: options.gitDate
                },
                owner: options.owner,
                repo: options.repo
            });
            core.debug("create tag" + JSON.stringify(tagRes));
            const refRes = yield octokit.rest.git.createRef({
                owner: options.owner,
                repo: options.repo,
                sha: tagRes.data.sha,
                ref: `refs/tags/${options.gitTagName}`
            });
            core.debug("creat ref to tag:" + JSON.stringify(refRes));
        }
        catch (createTagError) {
            core.warning("create tag and get unexpected error: " + (createTagError === null || createTagError === void 0 ? void 0 : createTagError.message));
        }
    }
});