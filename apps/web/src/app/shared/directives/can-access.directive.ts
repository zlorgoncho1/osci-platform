import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { PermissionService } from '../../core/services/permission.service';

@Directive({
  selector: '[canAccess]',
  standalone: true,
})
export class CanAccessDirective implements OnInit, OnDestroy {
  @Input('canAccess') resourceType!: string;
  @Input('canAccessAction') action: string = 'read';
  @Input('canAccessResourceId') resourceId?: string;

  private subscription?: Subscription;
  private hasView = false;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService,
  ) {}

  ngOnInit(): void {
    this.subscription = this.permissionService.permissions$.subscribe(() => {
      this.updateView();
    });
    this.updateView();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  private updateView(): void {
    let allowed: boolean;

    if (this.resourceId) {
      allowed = this.permissionService.canResource(
        this.resourceType,
        this.resourceId,
        this.action,
      );
    } else {
      allowed = this.permissionService.canGlobal(
        this.resourceType,
        this.action,
      );
    }

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
