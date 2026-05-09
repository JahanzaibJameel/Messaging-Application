## Pull Request Template

### 📋 Overview
<!-- Brief description of what this PR does -->

### 🎯 Type
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 🎨 UI/UX improvement
- [ ] 📚 Documentation
- [ ] 🔧 Configuration/Infrastructure
- [ ] ♻️ Refactoring
- [ ] 🧪 Tests
- [ ] 🚀 Performance
- [ ] 🔒 Security

### 📝 Description
<!-- Detailed description of changes -->

### 🔗 Related Issue
<!-- Link to the issue this PR addresses -->
- Closes #[issue_number]

### 🧪 Test Plan
<!-- Describe how you tested this change -->

#### Unit Tests
- [ ] All existing tests pass
- [ ] New unit tests added for new functionality
- [ ] Test coverage ≥85%

#### Component Tests
- [ ] Component renders correctly
- [ ] Component handles edge cases
- [ ] Component is accessible (WCAG 2.1 AA)
- [ ] Component works across different screen sizes

#### Integration Tests
- [ ] Feature works end-to-end
- [ ] API integration works correctly
- [ ] State management works as expected

#### Manual Testing
- [ ] Tested on iOS simulator/device
- [ ] Tested on Android emulator/device
- [ ] Tested on web (if applicable)
- [ ] Tested with different network conditions

#### Accessibility Testing
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Color contrast ratios (≥4.5:1)
- [ ] Touch target sizes (≥44x44 points)

#### Internationalization Testing
- [ ] Text is translatable
- [ ] Layout works with different languages (RTL/LTR)
- [ ] Date/time formatting respects locale
- [ ] Number formatting respects locale

### 📸 Screenshots / Videos
<!-- Add screenshots or videos for UI changes -->

### 🚀 Feature Flag Impact
<!-- Describe any feature flag changes -->

#### New Flags
- [ ] No new feature flags
- [ ] New feature flag(s) added:
  - Flag name: `flag_name`
  - Description: Brief description
  - Default value: true/false
  - Rollout percentage: 0-100%

#### Changed Flags
- [ ] No existing flags changed
- [ ] Changed flag(s):
  - Flag name: `flag_name`
  - Change: [description of change]
  - Reason: [why the change was needed]

#### A/B Testing
- [ ] No A/B testing impact
- [ ] A/B testing changes:
  - [ ] Rollout percentage modified
  - [ ] Target audience changed
  - [ ] Success metrics defined

### 🔒 Security Considerations
<!-- Address any security implications -->

- [ ] No security implications
- [ ] Security considerations:
  - [ ] Input validation implemented
  - [ ] Authentication/authorization checked
  - [ ] Sensitive data handled properly
  - [ ] No console.log in production code
  - [ ] No hardcoded secrets

### 📦 Dependencies
<!-- List any new dependencies or version changes -->

- [ ] No dependency changes
- [ ] Dependencies added/updated:
  - Package: version - Reason

### 📊 Performance Impact
<!-- Describe any performance implications -->

- [ ] No performance impact
- [ ] Performance considerations:
  - [ ] Bundle size impact: minimal/moderate/significant
  - [ ] Runtime performance: improved/unchanged/degraded
  - [ ] Memory usage: unchanged/increased/decreased

### 🔄 Breaking Changes
<!-- List any breaking changes -->

- [ ] No breaking changes
- [ ] Breaking changes:
  - [ ] API changes
  - [ ] Database schema changes
  - [ ] Configuration changes
  - [ ] Migration path documented

### 📚 Documentation
<!-- Link to documentation updates -->

- [ ] No documentation updates needed
- [ ] Documentation updated:
  - [ ] README.md
  - [ ] API documentation
  - [ ] User guide
  - [ ] Developer guide

### ✅ Checklist
<!-- Review the checklist before submitting -->

#### Code Quality
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is clean and well-documented
- [ ] No TODO comments left in production code

#### Testing
- [ ] All tests pass locally
- [ ] New tests added for new functionality
- [ ] Test coverage ≥85%
- [ ] Manual testing completed

#### Security
- [ ] Security review completed
- [ ] No secrets or sensitive data exposed
- [ ] Dependencies are secure (no high/critical vulnerabilities)

#### Performance
- [ ] Bundle size under 1.5MB limit
- [ ] No performance regressions
- [ ] Memory usage acceptable

#### Accessibility
- [ ] Accessibility review completed
- [ ] WCAG 2.1 AA compliant
- [ ] Screen reader friendly
- [ ] Keyboard navigable

#### Internationalization
- [ ] Text is externalized
- [ ] Layout works with different languages
- [ ] No hardcoded strings

### 🔗 Additional Links
<!-- Add any relevant links -->

- [ ] Design mockups
- [ ] Technical specifications
- [ ] User stories
- [ ] Performance benchmarks

### 📝 Additional Notes
<!-- Any additional context for reviewers -->

---

### 📋 Review Guidelines
For reviewers:

1. **Code Quality**: Check for clean, maintainable code
2. **Functionality**: Ensure the feature works as described
3. **Testing**: Verify adequate test coverage
4. **Security**: Review for security implications
5. **Performance**: Check for performance impact
6. **Accessibility**: Ensure accessibility standards are met
7. **Documentation**: Verify documentation is updated

### 🚀 Merge Requirements
- [ ] All checks pass (CI/CD pipeline)
- [ ] At least one approval from a code reviewer
- [ ] No conflicts with main branch
- [ ] All discussions resolved
- [ ] Ready for production deployment
