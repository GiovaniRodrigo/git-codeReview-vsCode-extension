import * as vscode from "vscode";
import { GitService } from "../git/gitService";
import { buildCompareModel, CompareModel } from "./compareModel";

export class CompareDocument {
  private _model: CompareModel | undefined;
  private readonly _onDidChange = new vscode.EventEmitter<CompareModel>();

  public readonly onDidChange = this._onDidChange.event;

  constructor(
    public readonly rootPath: string,
    public readonly base: string,
    public readonly head: string,
    private readonly git: GitService
  ) {}

  public get model(): CompareModel | undefined {
    return this._model;
  }

  public async load(): Promise<void> {
    const files = await this.git.getChangesBetweenRefs(this.rootPath, this.base, this.head);
    this._model = buildCompareModel(this.rootPath, this.base, this.head, files);
    this._onDidChange.fire(this._model);
  }

  public dispose(): void {
    this._onDidChange.dispose();
  }
}
