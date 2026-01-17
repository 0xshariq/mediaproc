export const EXIT_CODES = {
    SUCCESS: 0, // Meaning: Success
    USER_INPUT: 1, // Meaning: Invalid user input (flags, args, paths)
    FS_ERROR: 2, // Meaning: File system error (missing file, permission denied)
    TOOL_ERROR: 3, // Meaning: External tool error (e.g., ffmpeg failure), Backend/tool error (ffmpeg, sharp, etc.)
    UNSUPPORTED: 4, // Meaning: Unsupported operation or format
    PLUGIN_ERROR: 5, // Meaning: Plugin-related error, Plugin not found or plugin load failure
    INTERNAL: 6 // Meaning: Internal application error, Internal MediaProc error
}
