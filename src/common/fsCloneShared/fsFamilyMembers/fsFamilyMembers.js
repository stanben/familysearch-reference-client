(function(){
  'use strict';
  angular.module('fsCloneShared')
    .directive('fsFamilyMembers', function (fsApi, fsUtils) {
      return {
        templateUrl: 'fsCloneShared/fsFamilyMembers/fsFamilyMembers.tpl.html',
        scope: {
          family: '=', // {husband, wife, relationshipId, children ({person, parentsId} - optional), couple (optional)}
          focusId: '=',
          showPreferred: '@',
          preferred: '=' // {relationshipId}
        },
        link: function(scope) {
          // if we haven't passed in the children or we haven't passed in a couple
          // then read them
          if (scope.family.children == null ||
              (scope.family.couple == null && !!scope.family.husband && !!scope.family.wife)) {
            var primaryId, spouseId;
            if (scope.family.husband && scope.family.wife) {
              primaryId = scope.family.husband.id;
              spouseId = scope.family.wife.id;
            }
            else if (scope.family.husband) {
              primaryId = scope.family.husband.id;
              spouseId = null;
            }
            else {
              primaryId = scope.family.wife.id;
              spouseId = null;
            }
            fsApi.getPersonWithRelationships(primaryId, {persons: true}).then(function(response) {
              if (spouseId) {
                scope.couple = response.getSpouseRelationship(spouseId);
              }
              scope.children = fsUtils.getChildrenWithParentsId(response.getChildrenOf(spouseId),
                                                                response.getChildRelationshipsOf(spouseId));
            });
          }
          else {
            scope.couple = scope.family.couple;
            scope.children = scope.family.children;
          }

          scope.toggleHideChildren = function() {
            scope.family._hideChildren = scope.family._hideChildren ? false : true;
          };

          scope.isFocus = function(person) {
            return person && person.id === scope.focusId ? 'true' : 'false';
          };

          scope.$watch(function() {
            return scope.preferred.relationshipId;
          }, function() {
            scope.isPreferred = {
              value: !!scope.family.relationshipId && scope.family.relationshipId === scope.preferred.relationshipId
            };
          });

          scope.changePreferred = function() {
            scope.$emit('save', scope.family.relationshipId, scope.isPreferred.value);
          };

          scope.addChild = function() {
            scope.$emit('navigate', 'find-add', fsUtils.removeEmptyProperties({
              fatherId: !!scope.family.husband ? scope.family.husband.id : null,
              motherId: !!scope.family.wife ? scope.family.wife.id : null,
              returnToPersonId: scope.focusId
            }));
          };

          scope.editCouple = function() {
            scope.$emit('navigate', 'couple', {
              coupleId: scope.couple.id
            });
          };

          scope.$on('addSpouse', function(event) {
            event.stopPropagation();
            scope.$emit('navigate', 'find-add', fsUtils.removeEmptyProperties({
              husbandId: !!scope.family.husband ? scope.family.husband.id : null,
              wifeId: !!scope.family.wife ? scope.family.wife.id : null,
              childIds: _.map(scope.children, function(child) { return child.person.id; }).join(','),
              returnToPersonId: scope.focusId
            }));
          });

        }
      };
    });
})();
