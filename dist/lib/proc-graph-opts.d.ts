export interface CliOptions {
    quiet?: boolean;
    noProgressBar?: boolean;
    output?: string;
    input?: string;
    concurrency?: number;
    endpoint?: string;
    dataset?: string;
    help?: boolean;
    verbose?: boolean;
    rois?: string[];
    roisFile?: string;
    roiClass?: string;
}
export declare const args: CliOptions;
export default args;
